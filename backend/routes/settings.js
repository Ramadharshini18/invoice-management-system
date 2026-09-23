const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');

const router = express.Router();

// ─── Multer Config ────────────────────────────────────────────────────────────

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, svg, webp).'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ─── GET /api/settings ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found.' });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/settings ────────────────────────────────────────────────────────
router.put('/', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Settings not found.' });
    }

    const {
      company_name          = existing.company_name,
      address               = existing.address,
      phone                 = existing.phone,
      email                 = existing.email,
      website               = existing.website,
      gst_number            = existing.gst_number,
      invoice_prefix        = existing.invoice_prefix,
      starting_number       = existing.starting_number,
      next_number           = existing.next_number,
      default_tax_rate      = existing.default_tax_rate,
      default_payment_terms = existing.default_payment_terms,
      currency              = existing.currency
    } = req.body;

    db.prepare(`
      UPDATE settings SET
        company_name          = $company_name,
        address               = $address,
        phone                 = $phone,
        email                 = $email,
        website               = $website,
        gst_number            = $gst_number,
        invoice_prefix        = $invoice_prefix,
        starting_number       = $starting_number,
        next_number           = $next_number,
        default_tax_rate      = $default_tax_rate,
        default_payment_terms = $default_payment_terms,
        currency              = $currency
      WHERE id = 1
    `).run({
      $company_name:          company_name,
      $address:               address,
      $phone:                 phone,
      $email:                 email,
      $website:               website,
      $gst_number:            gst_number,
      $invoice_prefix:        invoice_prefix,
      $starting_number:       Number(starting_number),
      $next_number:           Number(next_number),
      $default_tax_rate:      Number(default_tax_rate),
      $default_payment_terms: String(default_payment_terms),
      $currency:              currency
    });

    const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/settings/logo ──────────────────────────────────────────────────
// Uploads a logo image, deletes the old one, updates logo_path in settings.
router.post('/logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const existing = db.prepare('SELECT logo_path FROM settings WHERE id = 1').get();

    // Delete previous logo if it exists on disk
    if (existing && existing.logo_path) {
      const oldFile = path.join(__dirname, '..', existing.logo_path.replace(/^\//, ''));
      if (fs.existsSync(oldFile)) {
        try { fs.unlinkSync(oldFile); } catch (_) { /* ignore if already gone */ }
      }
    }

    const relativePath = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE settings SET logo_path = ? WHERE id = 1').run(relativePath);

    const logoUrl = `http://localhost:5000${relativePath}`;
    res.json({ success: true, logoUrl, logo_path: relativePath });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Multer error handler for this router
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Upload failed.' });
});

module.exports = router;
