const express = require('express');
const db = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET all products (public)
router.get('/', (req, res) => {
  try {
    const products = db.prepare(
      "SELECT * FROM products WHERE status = 'approved'"
    ).all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller's own products
router.get('/my/list', verifyToken, verifyRole('seller'), (req, res) => {
  try {
    const products = db.prepare(
      'SELECT * FROM products WHERE seller_id = ?'
    ).all(req.user.id);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product by id (public)
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ?').all(req.params.id);
    res.json({ ...product, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE product
router.post('/', verifyToken, verifyRole('seller'), (req, res) => {
  try {
    const { name, category_id, description, price, stock, condition, location } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Product name aur price zaroori hai' });
    }

    const insert = db.prepare(
      `INSERT INTO products (seller_id, category_id, name, description, price, stock, condition, location, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    );
    const result = insert.run(
      req.user.id, category_id || null, name, description || '', price, stock || 0, condition || '', location || ''
    );

    res.status(201).json({ message: 'Product add ho gaya, admin approval ka wait hai', productId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD image for a product
router.post('/:id/upload-image', verifyToken, verifyRole('seller'), upload.single('image'), (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Ye tumhara product nahi hai' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Image file zaroori hai' });
    }

    const imagePath = '/uploads/' + req.file.filename;
    db.prepare('INSERT INTO product_images (product_id, image_path) VALUES (?, ?)').run(req.params.id, imagePath);

    res.json({ message: 'Image upload ho gayi', imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE product
router.put('/:id', verifyToken, verifyRole('seller'), (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Ye tumhara product nahi hai' });
    }

    const { name, category_id, description, price, stock, condition, location } = req.body;

    db.prepare(
      `UPDATE products SET name = ?, category_id = ?, description = ?, price = ?, stock = ?, condition = ?, location = ?
       WHERE id = ?`
    ).run(
      name || product.name,
      category_id || product.category_id,
      description || product.description,
      price || product.price,
      stock ?? product.stock,
      condition || product.condition,
      location || product.location,
      req.params.id
    );

    res.json({ message: 'Product update ho gaya' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', verifyToken, verifyRole('seller'), (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Ye tumhara product nahi hai' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product delete ho gaya' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
