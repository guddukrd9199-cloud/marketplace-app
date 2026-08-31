const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken, verifyRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

// GET all approved products (public)
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products WHERE status = 'approved'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller's own products
router.get("/my/list", verifyToken, verifyRole("seller"), async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products WHERE seller_id = $1", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product with images
router.get("/:id", async (req, res) => {
  try {
    const productResult = await db.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    const product = productResult.rows[0];
    if (!product) {
      return res.status(404).json({ error: "Product nahi mila" });
    }
    const imagesResult = await db.query("SELECT * FROM product_images WHERE product_id = $1", [req.params.id]);
    product.images = imagesResult.rows;
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product WITH image (ek saath)
router.post("/", verifyToken, verifyRole("seller"), upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, location } = req.body;

    const result = await db.query(
      "INSERT INTO products (name, description, price, location, seller_id, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id",
      [name, description, price, location, req.user.id]
    );

    const productId = result.rows[0].id;

    if (req.file) {
      const imagePath = "/uploads/" + req.file.filename;
      await db.query(
        "INSERT INTO product_images (product_id, image_path) VALUES ($1, $2)",
        [productId, imagePath]
      );
    }

    res.json({ message: "Product create ho gaya", productId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload additional image (alag se)
router.post("/:id/upload-image", verifyToken, verifyRole("seller"), upload.single("image"), async (req, res) => {
  try {
    const imagePath = "/uploads/" + req.file.filename;
    await db.query(
      "INSERT INTO product_images (product_id, image_path) VALUES ($1, $2)",
      [req.params.id, imagePath]
    );
    res.json({ message: "Image upload ho gayi", path: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
router.put("/:id", verifyToken, verifyRole("seller"), async (req, res) => {
  try {
    const productResult = await db.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    const product = productResult.rows[0];
    if (!product) {
      return res.status(404).json({ error: "Product nahi mila" });
    }
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Ye tumhara product nahi hai" });
    }

    const { name, description, price, location } = req.body;
    await db.query(
      "UPDATE products SET name = $1, description = $2, price = $3, location = $4 WHERE id = $5",
      [name, description, price, location, req.params.id]
    );

    res.json({ message: "Product update ho gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete("/:id", verifyToken, verifyRole("seller"), async (req, res) => {
  try {
    const productResult = await db.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    const product = productResult.rows[0];
    if (!product) {
      return res.status(404).json({ error: "Product nahi mila" });
    }
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Ye tumhara product nahi hai" });
    }

    await db.query("DELETE FROM products WHERE id = $1", [req.params.id]);
    res.json({ message: "Product delete ho gaya" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
