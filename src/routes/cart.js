const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Helper: user ka cart nikalo ya banao
function getOrCreateCart(userId) {
  let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);
  if (!cart) {
    const result = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
    cart = { id: result.lastInsertRowid, user_id: userId };
  }
  return cart;
}

// GET cart (apna cart dekho)
router.get('/', verifyToken, (req, res) => {
  try {
    const cart = getOrCreateCart(req.user.id);
    const items = db.prepare(`
      SELECT cart_items.id, cart_items.quantity, products.id as product_id,
             products.name, products.price, products.stock
      FROM cart_items
      JOIN products ON cart_items.product_id = products.id
      WHERE cart_items.cart_id = ?
    `).all(cart.id);

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD item to cart
router.post('/add', verifyToken, (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'product_id zaroori hai' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila' });
    }

    const cart = getOrCreateCart(req.user.id);

    const existing = db.prepare(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?'
    ).get(cart.id, product_id);

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?')
        .run(quantity || 1, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)')
        .run(cart.id, product_id, quantity || 1);
    }

    res.json({ message: 'Cart mein add ho gaya' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE item from cart
router.delete('/:itemId', verifyToken, (req, res) => {
  try {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.itemId);
    res.json({ message: 'Cart se hata diya' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
