const express = require('express');
const db = require('../db');

const router = express.Router();

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatInvoiceNumber(prefix, num) {
  return `${prefix}-${String(num).padStart(4, '0')}`;
}

// ─── GET /api/invoices/next-number ───────────────────────────────────────────
// MUST be declared before /:id to avoid being shadowed by the dynamic segment.
router.get('/next-number', (req, res) => {
  try {
    const settings = db
      .prepare('SELECT invoice_prefix, next_number FROM settings WHERE id = 1')
      .get();
    if (!settings) {
      return res.status(500).json({ success: false, message: 'Settings not configured.' });
    }
    const nextNumber = formatInvoiceNumber(settings.invoice_prefix, settings.next_number);
    res.json({ success: true, data: { nextNumber, raw: settings.next_number } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/invoices ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT
        i.*,
        COUNT(ii.id) AS item_count
      FROM invoices i
      LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `).all();
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/invoices/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    const items = db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC')
      .all(req.params.id);
    res.json({ success: true, data: { ...invoice, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/invoices ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const {
      invoice_number,
      customer_id      = null,
      customer_name    = '',
      customer_email   = '',
      customer_phone   = '',
      customer_address = '',
      customer_gst     = '',
      contact_person   = '',
      shipping_address = '',
      invoice_date     = '',
      due_date         = '',
      payment_terms    = '',
      status           = 'Draft',
      notes            = '',
      subtotal         = 0,
      discount_amount  = 0,
      taxable_amount   = 0,
      cgst             = 0,
      sgst             = 0,
      igst             = 0,
      grand_total      = 0,
      items            = []
    } = req.body;

    if (!invoice_number || String(invoice_number).trim() === '') {
      return res.status(400).json({ success: false, message: 'invoice_number is required.' });
    }

    db.exec('BEGIN');
    let newId;
    try {
      const invResult = db.prepare(`
        INSERT INTO invoices (
          invoice_number, customer_id, customer_name, customer_email,
          customer_phone, customer_address, customer_gst, contact_person,
          shipping_address, invoice_date, due_date, payment_terms, status,
          notes, subtotal, discount_amount, taxable_amount,
          cgst, sgst, igst, grand_total
        ) VALUES (
          $invoice_number, $customer_id, $customer_name, $customer_email,
          $customer_phone, $customer_address, $customer_gst, $contact_person,
          $shipping_address, $invoice_date, $due_date, $payment_terms, $status,
          $notes, $subtotal, $discount_amount, $taxable_amount,
          $cgst, $sgst, $igst, $grand_total
        )
      `).run({
        $invoice_number:   String(invoice_number).trim(),
        $customer_id:      customer_id,
        $customer_name:    customer_name,
        $customer_email:   customer_email,
        $customer_phone:   customer_phone,
        $customer_address: customer_address,
        $customer_gst:     customer_gst,
        $contact_person:   contact_person,
        $shipping_address: shipping_address,
        $invoice_date:     invoice_date,
        $due_date:         due_date,
        $payment_terms:    String(payment_terms),
        $status:           status,
        $notes:            notes,
        $subtotal:         Number(subtotal),
        $discount_amount:  Number(discount_amount),
        $taxable_amount:   Number(taxable_amount),
        $cgst:             Number(cgst),
        $sgst:             Number(sgst),
        $igst:             Number(igst),
        $grand_total:      Number(grand_total)
      });

      newId = invResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, product_name, description, quantity, unit,
          unit_price, discount, tax_rate, total
        ) VALUES (
          $invoice_id, $product_name, $description, $quantity, $unit,
          $unit_price, $discount, $tax_rate, $total
        )
      `);

      for (const item of items) {
        insertItem.run({
          $invoice_id:   newId,
          $product_name: item.product_name || '',
          $description:  item.description  || '',
          $quantity:     Number(item.quantity   || 1),
          $unit:         item.unit          || 'pcs',
          $unit_price:   Number(item.unit_price || 0),
          $discount:     Number(item.discount   || 0),
          $tax_rate:     Number(item.tax_rate   || 0),
          $total:        Number(item.total      || 0)
        });
      }

      // Increment next_number in settings
      db.prepare('UPDATE settings SET next_number = next_number + 1 WHERE id = 1').run();

      db.exec('COMMIT');
    } catch (innerErr) {
      db.exec('ROLLBACK');
      throw innerErr;
    }

    const invoice   = db.prepare('SELECT * FROM invoices WHERE id = ?').get(newId);
    const savedItems = db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC')
      .all(newId);

    res.status(201).json({ success: true, data: { ...invoice, items: savedItems } });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'Invoice number already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/invoices/:id ────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const {
      invoice_number   = existing.invoice_number,
      customer_id      = existing.customer_id,
      customer_name    = existing.customer_name,
      customer_email   = existing.customer_email,
      customer_phone   = existing.customer_phone,
      customer_address = existing.customer_address,
      customer_gst     = existing.customer_gst,
      contact_person   = existing.contact_person,
      shipping_address = existing.shipping_address,
      invoice_date     = existing.invoice_date,
      due_date         = existing.due_date,
      payment_terms    = existing.payment_terms,
      status           = existing.status,
      notes            = existing.notes,
      subtotal         = existing.subtotal,
      discount_amount  = existing.discount_amount,
      taxable_amount   = existing.taxable_amount,
      cgst             = existing.cgst,
      sgst             = existing.sgst,
      igst             = existing.igst,
      grand_total      = existing.grand_total,
      items            = []
    } = req.body;

    if (!invoice_number || String(invoice_number).trim() === '') {
      return res.status(400).json({ success: false, message: 'invoice_number is required.' });
    }

    db.exec('BEGIN');
    try {
      db.prepare(`
        UPDATE invoices SET
          invoice_number   = $invoice_number,
          customer_id      = $customer_id,
          customer_name    = $customer_name,
          customer_email   = $customer_email,
          customer_phone   = $customer_phone,
          customer_address = $customer_address,
          customer_gst     = $customer_gst,
          contact_person   = $contact_person,
          shipping_address = $shipping_address,
          invoice_date     = $invoice_date,
          due_date         = $due_date,
          payment_terms    = $payment_terms,
          status           = $status,
          notes            = $notes,
          subtotal         = $subtotal,
          discount_amount  = $discount_amount,
          taxable_amount   = $taxable_amount,
          cgst             = $cgst,
          sgst             = $sgst,
          igst             = $igst,
          grand_total      = $grand_total,
          updated_at       = CURRENT_TIMESTAMP
        WHERE id = $id
      `).run({
        $invoice_number:   String(invoice_number).trim(),
        $customer_id:      customer_id,
        $customer_name:    customer_name,
        $customer_email:   customer_email,
        $customer_phone:   customer_phone,
        $customer_address: customer_address,
        $customer_gst:     customer_gst,
        $contact_person:   contact_person,
        $shipping_address: shipping_address,
        $invoice_date:     invoice_date,
        $due_date:         due_date,
        $payment_terms:    String(payment_terms),
        $status:           status,
        $notes:            notes,
        $subtotal:         Number(subtotal),
        $discount_amount:  Number(discount_amount),
        $taxable_amount:   Number(taxable_amount),
        $cgst:             Number(cgst),
        $sgst:             Number(sgst),
        $igst:             Number(igst),
        $grand_total:      Number(grand_total),
        $id:               req.params.id
      });

      // Replace all line items (FK cascade on delete ensures referential integrity)
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);

      const insertItem = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, product_name, description, quantity, unit,
          unit_price, discount, tax_rate, total
        ) VALUES (
          $invoice_id, $product_name, $description, $quantity, $unit,
          $unit_price, $discount, $tax_rate, $total
        )
      `);

      for (const item of items) {
        insertItem.run({
          $invoice_id:   req.params.id,
          $product_name: item.product_name || '',
          $description:  item.description  || '',
          $quantity:     Number(item.quantity   || 1),
          $unit:         item.unit          || 'pcs',
          $unit_price:   Number(item.unit_price || 0),
          $discount:     Number(item.discount   || 0),
          $tax_rate:     Number(item.tax_rate   || 0),
          $total:        Number(item.total      || 0)
        });
      }

      db.exec('COMMIT');
    } catch (innerErr) {
      db.exec('ROLLBACK');
      throw innerErr;
    }

    const invoice    = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    const savedItems = db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC')
      .all(req.params.id);

    res.json({ success: true, data: { ...invoice, items: savedItems } });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'Invoice number already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/invoices/:id ─────────────────────────────────────────────────
// Items are cascade-deleted by the FK constraint defined in the schema.
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM invoices WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
