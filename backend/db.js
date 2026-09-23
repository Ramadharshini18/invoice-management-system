/**
 * db.js – Database initialiser using the built-in node:sqlite module (Node 22.5+).
 * No third-party native addon is required.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'invoice.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign key support
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ─── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    company_name TEXT DEFAULT 'ABC Company',
    address TEXT DEFAULT '123 Business Park, Tech City, TC 400001',
    phone TEXT DEFAULT '+91 98765 43210',
    email TEXT DEFAULT 'billing@abccompany.com',
    website TEXT DEFAULT 'www.abccompany.com',
    gst_number TEXT DEFAULT 'GST123456789',
    invoice_prefix TEXT DEFAULT 'INV',
    starting_number INTEGER DEFAULT 1,
    next_number INTEGER DEFAULT 5,
    default_tax_rate REAL DEFAULT 18,
    default_payment_terms TEXT DEFAULT '30',
    currency TEXT DEFAULT 'INR',
    logo_path TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    postal_code TEXT,
    gst_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    category TEXT,
    unit TEXT DEFAULT 'pcs',
    price REAL DEFAULT 0,
    tax_rate REAL DEFAULT 18,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_gst TEXT,
    contact_person TEXT,
    shipping_address TEXT,
    invoice_date TEXT,
    due_date TEXT,
    payment_terms TEXT,
    status TEXT DEFAULT 'Draft',
    notes TEXT,
    subtotal REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    taxable_amount REAL DEFAULT 0,
    cgst REAL DEFAULT 0,
    sgst REAL DEFAULT 0,
    igst REAL DEFAULT 0,
    grand_total REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_name TEXT,
    description TEXT,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    unit_price REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    tax_rate REAL DEFAULT 18,
    total REAL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );
`);

// ─── Seed Settings ────────────────────────────────────────────────────────────

const settingsCount = db.prepare('SELECT COUNT(*) AS cnt FROM settings').get();
if (settingsCount.cnt === 0) {
  db.prepare(`
    INSERT INTO settings (
      id, company_name, address, phone, email, website, gst_number,
      invoice_prefix, starting_number, next_number, default_tax_rate,
      default_payment_terms, currency, logo_path
    ) VALUES (
      1, 'ABC Company', '123 Business Park, Tech City, TC 400001',
      '+91 98765 43210', 'billing@abccompany.com', 'www.abccompany.com',
      'GST123456789', 'INV', 1, 5, 18, '30', 'INR', ''
    )
  `).run();
}

// ─── Seed Customers ───────────────────────────────────────────────────────────

const customerCount = db.prepare('SELECT COUNT(*) AS cnt FROM customers').get();
if (customerCount.cnt === 0) {
  const insertCustomer = db.prepare(`
    INSERT INTO customers (
      company_name, contact_person, email, phone, address,
      city, state, country, postal_code, gst_number
    ) VALUES (
      $company_name, $contact_person, $email, $phone, $address,
      $city, $state, $country, $postal_code, $gst_number
    )
  `);

  const seedCustomers = [
    {
      $company_name: 'XYZ Technologies',
      $contact_person: 'Raj Kumar',
      $email: 'raj@xyz.com',
      $phone: '+91 98765 11111',
      $address: '45 Tech Avenue, Andheri East',
      $city: 'Mumbai',
      $state: 'Maharashtra',
      $country: 'India',
      $postal_code: '400069',
      $gst_number: 'GST987654321'
    },
    {
      $company_name: 'GreenLeaf Enterprises',
      $contact_person: 'Priya Sharma',
      $email: 'priya@greenleaf.com',
      $phone: '+91 98765 22222',
      $address: '12 Green Park, Connaught Place',
      $city: 'Delhi',
      $state: 'Delhi',
      $country: 'India',
      $postal_code: '110001',
      $gst_number: 'GST111222333'
    },
    {
      $company_name: 'Metro Business Solutions',
      $contact_person: 'Ankit Patel',
      $email: 'ankit@metro.com',
      $phone: '+91 98765 33333',
      $address: '78 MG Road, Indiranagar',
      $city: 'Bengaluru',
      $state: 'Karnataka',
      $country: 'India',
      $postal_code: '560038',
      $gst_number: 'GST444555666'
    }
  ];

  seedCustomers.forEach(c => insertCustomer.run(c));
}

// ─── Seed Products ────────────────────────────────────────────────────────────

const productCount = db.prepare('SELECT COUNT(*) AS cnt FROM products').get();
if (productCount.cnt === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (name, sku, description, category, unit, price, tax_rate)
    VALUES ($name, $sku, $description, $category, $unit, $price, $tax_rate)
  `);

  const seedProducts = [
    {
      $name: 'Business Laptop',
      $sku: 'LAP001',
      $description: 'High-performance business laptop with Intel Core i7, 16GB RAM, 512GB SSD',
      $category: 'Electronics',
      $unit: 'pcs',
      $price: 65000,
      $tax_rate: 18
    },
    {
      $name: 'Wireless Keyboard',
      $sku: 'KB001',
      $description: 'Ergonomic wireless keyboard with multi-device pairing',
      $category: 'Electronics',
      $unit: 'pcs',
      $price: 2500,
      $tax_rate: 18
    },
    {
      $name: 'Wireless Mouse',
      $sku: 'MS001',
      $description: 'Silent wireless mouse with precision tracking',
      $category: 'Electronics',
      $unit: 'pcs',
      $price: 1500,
      $tax_rate: 18
    },
    {
      $name: 'Office Printer',
      $sku: 'PRN001',
      $description: 'Multifunction laser printer – print, scan, copy',
      $category: 'Electronics',
      $unit: 'pcs',
      $price: 18000,
      $tax_rate: 18
    },
    {
      $name: 'A4 Copier Paper',
      $sku: 'PAP001',
      $description: '500-sheet ream of A4 80gsm copier paper',
      $category: 'Stationery',
      $unit: 'ream',
      $price: 350,
      $tax_rate: 12
    },
    {
      $name: 'Software License',
      $sku: 'SFT001',
      $description: 'Annual software license for productivity suite',
      $category: 'Software',
      $unit: 'license',
      $price: 12000,
      $tax_rate: 18
    },
    {
      $name: 'IT Support Service',
      $sku: 'SVC001',
      $description: 'On-site or remote IT support and maintenance',
      $category: 'Services',
      $unit: 'hour',
      $price: 1500,
      $tax_rate: 18
    }
  ];

  seedProducts.forEach(p => insertProduct.run(p));
}

// ─── Seed Invoices ────────────────────────────────────────────────────────────

const invoiceCount = db.prepare('SELECT COUNT(*) AS cnt FROM invoices').get();
if (invoiceCount.cnt === 0) {
  db.exec('BEGIN');
  try {
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        invoice_number, customer_id, customer_name, customer_email,
        customer_phone, customer_address, customer_gst, contact_person,
        invoice_date, due_date, payment_terms, status, notes,
        subtotal, discount_amount, taxable_amount, cgst, sgst, igst, grand_total
      ) VALUES (
        $invoice_number, $customer_id, $customer_name, $customer_email,
        $customer_phone, $customer_address, $customer_gst, $contact_person,
        $invoice_date, $due_date, $payment_terms, $status, $notes,
        $subtotal, $discount_amount, $taxable_amount, $cgst, $sgst, $igst, $grand_total
      )
    `);

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        invoice_id, product_name, description, quantity, unit,
        unit_price, discount, tax_rate, total
      ) VALUES (
        $invoice_id, $product_name, $description, $quantity, $unit,
        $unit_price, $discount, $tax_rate, $total
      )
    `);

    // ── Invoice 1 – Paid (XYZ Technologies) ──────────────────────────────────
    const inv1 = insertInvoice.run({
      $invoice_number: 'INV-0001',
      $customer_id: 1,
      $customer_name: 'XYZ Technologies',
      $customer_email: 'raj@xyz.com',
      $customer_phone: '+91 98765 11111',
      $customer_address: '45 Tech Avenue, Andheri East, Mumbai, Maharashtra 400069',
      $customer_gst: 'GST987654321',
      $contact_person: 'Raj Kumar',
      $invoice_date: '2026-08-01',
      $due_date: '2026-08-31',
      $payment_terms: '30',
      $status: 'Paid',
      $notes: 'Thank you for your business!',
      $subtotal: 130000,
      $discount_amount: 0,
      $taxable_amount: 130000,
      $cgst: 11700,
      $sgst: 11700,
      $igst: 0,
      $grand_total: 153400
    });
    // 2 × Business Laptop @ ₹65,000, 18% GST
    insertItem.run({
      $invoice_id: inv1.lastInsertRowid,
      $product_name: 'Business Laptop',
      $description: 'High-performance business laptop with Intel Core i7, 16GB RAM, 512GB SSD',
      $quantity: 2,
      $unit: 'pcs',
      $unit_price: 65000,
      $discount: 0,
      $tax_rate: 18,
      $total: 130000
    });

    // ── Invoice 2 – Pending (GreenLeaf Enterprises) ───────────────────────────
    const inv2 = insertInvoice.run({
      $invoice_number: 'INV-0002',
      $customer_id: 2,
      $customer_name: 'GreenLeaf Enterprises',
      $customer_email: 'priya@greenleaf.com',
      $customer_phone: '+91 98765 22222',
      $customer_address: '12 Green Park, Connaught Place, Delhi, Delhi 110001',
      $customer_gst: 'GST111222333',
      $contact_person: 'Priya Sharma',
      $invoice_date: '2026-08-10',
      $due_date: '2026-09-09',
      $payment_terms: '30',
      $status: 'Pending',
      $notes: 'Payment due within 30 days.',
      $subtotal: 22000,
      $discount_amount: 0,
      $taxable_amount: 22000,
      $cgst: 1980,
      $sgst: 1980,
      $igst: 0,
      $grand_total: 25960
    });
    insertItem.run({
      $invoice_id: inv2.lastInsertRowid,
      $product_name: 'Wireless Keyboard',
      $description: 'Ergonomic wireless keyboard with multi-device pairing',
      $quantity: 4,
      $unit: 'pcs',
      $unit_price: 2500,
      $discount: 0,
      $tax_rate: 18,
      $total: 10000
    });
    insertItem.run({
      $invoice_id: inv2.lastInsertRowid,
      $product_name: 'Wireless Mouse',
      $description: 'Silent wireless mouse with precision tracking',
      $quantity: 4,
      $unit: 'pcs',
      $unit_price: 1500,
      $discount: 0,
      $tax_rate: 18,
      $total: 6000
    });
    insertItem.run({
      $invoice_id: inv2.lastInsertRowid,
      $product_name: 'Office Printer',
      $description: 'Multifunction laser printer – print, scan, copy',
      $quantity: 1,
      $unit: 'pcs',
      $unit_price: 18000,
      $discount: 0,
      $tax_rate: 18,
      $total: 18000
    });

    // ── Invoice 3 – Draft (Metro Business Solutions) ──────────────────────────
    const inv3 = insertInvoice.run({
      $invoice_number: 'INV-0003',
      $customer_id: 3,
      $customer_name: 'Metro Business Solutions',
      $customer_email: 'ankit@metro.com',
      $customer_phone: '+91 98765 33333',
      $customer_address: '78 MG Road, Indiranagar, Bengaluru, Karnataka 560038',
      $customer_gst: 'GST444555666',
      $contact_person: 'Ankit Patel',
      $invoice_date: '2026-09-01',
      $due_date: '2026-10-01',
      $payment_terms: '30',
      $status: 'Draft',
      $notes: 'Draft — pending review.',
      $subtotal: 60000,
      $discount_amount: 0,
      $taxable_amount: 60000,
      $cgst: 5400,
      $sgst: 5400,
      $igst: 0,
      $grand_total: 70800
    });
    // 5 × Software License @ ₹12,000
    insertItem.run({
      $invoice_id: inv3.lastInsertRowid,
      $product_name: 'Software License',
      $description: 'Annual software license for productivity suite',
      $quantity: 5,
      $unit: 'license',
      $unit_price: 12000,
      $discount: 0,
      $tax_rate: 18,
      $total: 60000
    });

    // ── Invoice 4 – Sent (XYZ Technologies) ──────────────────────────────────
    const inv4 = insertInvoice.run({
      $invoice_number: 'INV-0004',
      $customer_id: 1,
      $customer_name: 'XYZ Technologies',
      $customer_email: 'raj@xyz.com',
      $customer_phone: '+91 98765 11111',
      $customer_address: '45 Tech Avenue, Andheri East, Mumbai, Maharashtra 400069',
      $customer_gst: 'GST987654321',
      $contact_person: 'Raj Kumar',
      $invoice_date: '2026-09-10',
      $due_date: '2026-10-10',
      $payment_terms: '30',
      $status: 'Sent',
      $notes: 'IT support billed at hourly rate.',
      $subtotal: 30000,
      $discount_amount: 3000,
      $taxable_amount: 27000,
      $cgst: 2430,
      $sgst: 2430,
      $igst: 0,
      $grand_total: 31860
    });
    // 20 × IT Support Service @ ₹1,500, 10% discount
    insertItem.run({
      $invoice_id: inv4.lastInsertRowid,
      $product_name: 'IT Support Service',
      $description: 'On-site IT support and maintenance – September 2026',
      $quantity: 20,
      $unit: 'hour',
      $unit_price: 1500,
      $discount: 10,
      $tax_rate: 18,
      $total: 27000
    });

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  // next_number is already 5 (set in settings seed above)
}

module.exports = db;
