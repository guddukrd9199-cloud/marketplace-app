const express = require("express");
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Helper: user ka cart nikalo ya banao
async function getOrCreateCart(userId) {
  const result = await db.query("SELECT * FROM carts WHERE user_id = $1", [userId]);
  let cart = result.rows[0];
  if (!cart) {
    const insert = await db.query("INSERT INTO carts (user_id) VALUES ($1) RETURNING id", [userId]);
    cart = { id: insert.rows[0].id, user_id: userId };
  }
  return cart;
}

// GET cart (apna cart dekho)
router.get("/", verifyToken, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const result = await db.query(
      `SELECT cart_items.id, cart_items.quantity, products.id as product_id,
              products.name, products.price, products.stock
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.cart_id = $1`,
      [cart.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD item to cart
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: "product_id zaroori hai" });
    }

    const productResult = await db.query("SELECT * FROM products WHERE id = $1", [product_id]);
    const product = productResult.rows[0];
    if (!product) {
      return res.status(404).json({ error: "Product nahi mila" });
    }

    const cart = await getOrCreateCart(req.user.id);

    const existingResult = await db.query(
      "SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cart.id, product_id]
    );
    const existing = existingResult.rows[0];

    if (existing) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2",
        [quantity || 1, existing.id]
      );
    } else {
      await db.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)",
        [cart.id, product_id, quantity || 1]
      );
    }

    res.json({ message: "Cart mein add ho gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE item from cart
router.delete("/:itemId", verifyToken, async (req, res) => {
  try {
    await db.query("DELETE FROM cart_items WHERE id = $1", [req.params.itemId]);
    res.json({ message: "Cart se hata diya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
