const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// CHECKOUT (cart se order banao)
router.post('/checkout', verifyToken, (req, res) => {
  try {
    const { address } = req.body;
    const cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);

    if (!cart) {
      return res.status(400).json({ error: 'Cart khali hai' });
    }

    const items = db.prepare(`
      SELECT cart_items.*, products.price, products.seller_id, products.stock, products.name
      FROM cart_items
      JOIN products ON cart_items.product_id = products.id
      WHERE cart_items.cart_id = ?
    `).all(cart.id);

    if (items.length === 0) {
      return res.status(400).json({ error: 'Cart khali hai' });
    }

    let total = 0;
    items.forEach(item => { total += item.price * item.quantity; });

    const orderInsert = db.prepare(
      'INSERT INTO orders (buyer_id, total_amount, status, address) VALUES (?, ?, ?, ?)'
    );
    const orderResult = orderInsert.run(req.user.id, total, 'pending', address || '');
    const orderId = orderResult.lastInsertRowid;

    const itemInsert = db.prepare(
      'INSERT INTO order_items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, ?, ?)'
    );
    items.forEach(item => {
      itemInsert.run(orderId, item.product_id, item.seller_id, item.quantity, item.price);
    });

    // Cart khali karo
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

    res.status(201).json({ message: 'Order place ho gaya!', orderId, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET buyer's own orders
router.get('/my', verifyToken, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

