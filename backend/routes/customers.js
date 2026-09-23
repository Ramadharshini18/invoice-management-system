const express = require('express');
const db = require('../db');

const router = express.Router();

// ─── GET /api/customers ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const customers = db
      .prepare('SELECT * FROM customers ORDER BY created_at DESC')
      .all();
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/customers ──────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const {
      company_name,
      contact_person = '',
      email = '',
      phone = '',
      address = '',
      city = '',
      state = '',
      country = 'India',
      postal_code = '',
      gst_number = ''
    } = req.body;

    if (!company_name || company_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'company_name is required.' });
    }

    // Check for duplicates
    const duplicate = db.prepare('SELECT id FROM customers WHERE LOWER(company_name) = ?').get(company_name.trim().toLowerCase());
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A customer with this company name already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO customers
        (company_name, contact_person, email, phone, address, city, state, country, postal_code, gst_number)
      VALUES
        ($company_name, $contact_person, $email, $phone, $address, $city, $state, $country, $postal_code, $gst_number)
    `).run({
      $company_name: company_name.trim(),
      $contact_person: contact_person,
      $email: email,
      $phone: phone,
      $address: address,
      $city: city,
      $state: state,
      $country: country,
      $postal_code: postal_code,
      $gst_number: gst_number
    });

    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/customers/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/customers/:id ───────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const {
      company_name    = existing.company_name,
      contact_person  = existing.contact_person,
      email           = existing.email,
      phone           = existing.phone,
      address         = existing.address,
      city            = existing.city,
      state           = existing.state,
      country         = existing.country,
      postal_code     = existing.postal_code,
      gst_number      = existing.gst_number
    } = req.body;

    if (!company_name || company_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'company_name is required.' });
    }

    // Check for duplicates (excluding self)
    const duplicate = db.prepare('SELECT id FROM customers WHERE LOWER(company_name) = ? AND id != ?').get(company_name.trim().toLowerCase(), req.params.id);
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A customer with this company name already exists.' });
    }

    db.prepare(`
      UPDATE customers SET
        company_name   = $company_name,
        contact_person = $contact_person,
        email          = $email,
        phone          = $phone,
        address        = $address,
        city           = $city,
        state          = $state,
        country        = $country,
        postal_code    = $postal_code,
        gst_number     = $gst_number
      WHERE id = $id
    `).run({
      $company_name:   company_name.trim(),
      $contact_person: contact_person,
      $email:          email,
      $phone:          phone,
      $address:        address,
      $city:           city,
      $state:          state,
      $country:        country,
      $postal_code:    postal_code,
      $gst_number:     gst_number,
      $id:             req.params.id
    });

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/customers/:id ────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
