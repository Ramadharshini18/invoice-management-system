const express = require('express');
const db = require('../db');

const router = express.Router();

// ─── GET /api/products ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const products = db
      .prepare('SELECT * FROM products ORDER BY created_at DESC')
      .all();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/products ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const {
      name,
      sku         = '',
      description = '',
      category    = '',
      unit        = 'pcs',
      price       = 0,
      tax_rate    = 18
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'name is required.' });
    }

    // Check for duplicates
    const duplicate = db.prepare('SELECT id FROM products WHERE LOWER(name) = ?').get(name.trim().toLowerCase());
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A product with this name already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO products (name, sku, description, category, unit, price, tax_rate)
      VALUES ($name, $sku, $description, $category, $unit, $price, $tax_rate)
    `).run({
      $name:        name.trim(),
      $sku:         sku,
      $description: description,
      $category:    category,
      $unit:        unit,
      $price:       Number(price),
      $tax_rate:    Number(tax_rate)
    });

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      name        = existing.name,
      sku         = existing.sku,
      description = existing.description,
      category    = existing.category,
      unit        = existing.unit,
      price       = existing.price,
      tax_rate    = existing.tax_rate
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'name is required.' });
    }

    // Check for duplicates (excluding self)
    const duplicate = db.prepare('SELECT id FROM products WHERE LOWER(name) = ? AND id != ?').get(name.trim().toLowerCase(), req.params.id);
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'A product with this name already exists.' });
    }

    db.prepare(`
      UPDATE products SET
        name        = $name,
        sku         = $sku,
        description = $description,
        category    = $category,
        unit        = $unit,
        price       = $price,
        tax_rate    = $tax_rate
      WHERE id = $id
    `).run({
      $name:        name.trim(),
      $sku:         sku,
      $description: description,
      $category:    category,
      $unit:        unit,
      $price:       Number(price),
      $tax_rate:    Number(tax_rate),
      $id:          req.params.id
    });

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
