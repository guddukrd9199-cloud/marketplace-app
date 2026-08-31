const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken, verifyRole } = require("../middleware/auth");

// GET pending products (admin only)
router.get("/products/pending", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products WHERE status = 'pending'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT approve product (admin only)
router.put("/products/:id/approve", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    await db.query("UPDATE products SET status = 'approved' WHERE id = $1", [req.params.id]);
    res.json({ message: "Product approve ho gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT reject product (admin only)
router.put("/products/:id/reject", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    await db.query("UPDATE products SET status = 'rejected' WHERE id = $1", [req.params.id]);
    res.json({ message: "Product reject ho gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all users (admin only)
router.get("/users", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, email, role FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEMPORARY - Make user admin by email (ISKO BAAD MEIN HATA DENGE)
router.get("/make-admin/:email", async (req, res) => {
  try {
    await db.query("UPDATE users SET role = 'admin' WHERE email = $1", [req.params.email]);
    res.json({ message: "User ab admin ban gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
