const express = require("express");
const db = require("../config/db");
const { verifyToken, verifyRole } = require("../middleware/auth");

const router = express.Router();
const SELLER_UPI_ID = "shivmkr00@nyes";

// CHECKOUT (cart se order banao)
router.post("/checkout", verifyToken, async (req, res) => {
  try {
    const { address, latitude, longitude, paymentMethod } = req.body;
    const method = paymentMethod === "upi" ? "upi" : "cod";

    const cartResult = await db.query("SELECT * FROM carts WHERE user_id = $1", [req.user.id]);
    const cart = cartResult.rows[0];

    if (!cart) {
      return res.status(400).json({ error: "Cart khali hai" });
    }

    const itemsResult = await db.query(
      `SELECT cart_items.*, products.price, products.seller_id, products.stock, products.name
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.cart_id = $1`,
      [cart.id]
    );
    const items = itemsResult.rows;

    if (items.length === 0) {
      return res.status(400).json({ error: "Cart khali hai" });
    }

    let total = 0;
    items.forEach(item => { total += item.price * item.quantity; });

    const orderInsert = await db.query(
      "INSERT INTO orders (buyer_id, total_amount, status, address, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [req.user.id, total, "pending", address || "", latitude || null, longitude || null]
    );
    const orderId = orderInsert.rows[0].id;

    for (const item of items) {
      await db.query(
        "INSERT INTO order_items (order_id, product_id, seller_id, quantity, price) VALUES ($1, $2, $3, $4, $5)",
        [orderId, item.product_id, item.seller_id, item.quantity, item.price]
      );
    }

    await db.query(
      "INSERT INTO payments (order_id, amount, method, status) VALUES ($1, $2, $3, $4)",
      [orderId, total, method, "pending"]
    );

    await db.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);

    res.status(201).json({
      message: method === "upi" ? "Order place ho gaya! UPI se payment karo." : "Order place ho gaya! Cash on Delivery.",
      orderId,
      total,
      method,
      upiId: method === "upi" ? SELLER_UPI_ID : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET buyer's own orders
router.get("/my", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT orders.*, payments.method AS payment_method, payments.status AS payment_status
       FROM orders
       LEFT JOIN payments ON payments.order_id = orders.id
       WHERE orders.buyer_id = $1
       ORDER BY orders.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT buyer marks "Maine payment kar diya" (UPI order ke liye)
router.put("/:orderId/mark-paid", verifyToken, async (req, res) => {
  try {
    const orderResult = await db.query("SELECT * FROM orders WHERE id = $1", [req.params.orderId]);
    const order = orderResult.rows[0];
    if (!order || order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: "Ye tumhara order nahi hai" });
    }

    await db.query("UPDATE payments SET status = 'verification_pending' WHERE order_id = $1", [req.params.orderId]);
    res.json({ message: "Payment status update ho gaya, verification ka wait karo" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT cancel order (buyer khud apna order cancel kar sakta hai, sirf pending status mein)
router.put("/:orderId/cancel", verifyToken, async (req, res) => {
  try {
    const orderResult = await db.query("SELECT * FROM orders WHERE id = $1", [req.params.orderId]);
    const order = orderResult.rows[0];

    if (!order) {
      return res.status(404).json({ error: "Order nahi mila" });
    }
    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: "Ye tumhara order nahi hai" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ error: "Ye order ab cancel nahi ho sakta (status: " + order.status + ")" });
    }

    await db.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [req.params.orderId]);
    res.json({ message: "Order cancel ho gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller's orders (jinke products bike hain)
router.get("/seller", verifyToken, verifyRole("seller"), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT order_items.id, order_items.order_id, order_items.product_id,
              order_items.quantity, order_items.price,
              products.name AS product_name,
              orders.status AS order_status, orders.address, orders.created_at
       FROM order_items
       JOIN products ON order_items.product_id = products.id
       JOIN orders ON order_items.order_id = orders.id
       WHERE order_items.seller_id = $1
       ORDER BY orders.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all orders with location aur payment status (admin only)
router.get("/all", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT orders.*, users.name AS buyer_name, users.email AS buyer_email,
              payments.method AS payment_method, payments.status AS payment_status
       FROM orders
       JOIN users ON orders.buyer_id = users.id
       LEFT JOIN payments ON payments.order_id = orders.id
       ORDER BY orders.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT admin confirms UPI payment
router.put("/:orderId/confirm-payment", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    await db.query("UPDATE payments SET status = 'confirmed' WHERE order_id = $1", [req.params.orderId]);
    res.json({ message: "Payment confirm ho gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update order status (seller apne order ka status badal sakta hai)
router.put("/:orderId/status", verifyToken, verifyRole("seller"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "completed", "shipped", "delivered", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Galat status" });
    }

    await db.query("UPDATE orders SET status = $1 WHERE id = $2", [status, req.params.orderId]);
    res.json({ message: "Order status update ho gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
