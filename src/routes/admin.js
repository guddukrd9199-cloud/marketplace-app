const express = require('express');
const db = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

const router = express.Router();

router.get('/products/pending', verifyToken, verifyRole('admin'), (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products WHERE status = 'pending'").all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id/approve', verifyToken, verifyRole('admin'), (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    db.prepare("UPDATE products SET status = 'approved' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Product approve ho gaya' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id/reject', verifyToken, verifyRole('admin'), (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }
    db.prepare("UPDATE products SET status = 'rejected' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Product reject ho gaya' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', verifyToken, verifyRole('admin'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
