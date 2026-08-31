const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET all approved products (public)
router.get('/', (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products WHERE status = 'approved'").all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller's own products
router.get('/my/list', verifyToken, verifyRole('seller'), (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products WHERE seller_id = ?").all(req.user.id);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product with images
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    const images = db.prepare("SELECT * FROM product_images WHERE product_id = ?").all(req.params.id);
    product.images = images;
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product WITH image (ek saath)
router.post('/', verifyToken, verifyRole('seller'), upload.single('image'), (req, res) => {
  try {
    const { title, description, price, location } = req.body;

    const result = db.prepare(
      "INSERT INTO products (title, description, price, location, seller_id, status) VALUES (?, ?, ?, ?, ?, 'pending')"
    ).run(title, description, price, location, req.user.id);

    const productId = result.lastInsertRowid;

    // Agar image aayi hai to usko bhi save karo
    if (req.file) {
      const imagePath = '/uploads/' + req.file.filename;
      db.prepare(
        "INSERT INTO product_images (product_id, image_path) VALUES (?, ?)"
      ).run(productId, imagePath);
    }

    res.json({ message: 'Product create ho gaya', productId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload additional image (alag se, agar chahiye to)
router.post('/:id/upload-image', verifyToken, verifyRole('seller'), upload.single('image'), (req, res) => {
  try {
    const imagePath = '/uploads/' + req.file.filename;
    db.prepare(
      "INSERT INTO product_images (product_id, image_path) VALUES (?, ?)"
    ).run(req.params.id, imagePath);
    res.json({ message: 'Image upload ho gayi', path: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
router.put('/:id', verifyToken, verifyRole('seller'), (req, res) => {
  try {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Ye tumhara product nahi hai' });
    }

    const { title, description, price, location } = req.body;
    db.prepare(
      "UPDATE products SET title = ?, description = ?, price = ?, location = ? WHERE id = ?"
    ).run(title, description, price, location, req.params.id);

    res.json({ message: 'Product update ho gaya' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', verifyToken, verifyRole('seller'), (req, res) => {
  try {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Ye tumhara product nahi hai' });
    }

    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ message: 'Product delete ho gaya' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
