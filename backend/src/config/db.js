const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDb() {
  try {
    const check = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'users'"
    );

    if (check.rows.length === 0) {
      console.log('Tables missing hain, schema create kar rahe hain...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('Schema successfully create ho gaya!');
    } else {
      console.log('Tables already exist hain, sab theek hai.');
    }

    // Naye columns add karo agar nahi hain (existing database ke liye)
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude REAL");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude REAL");
    console.log('Location columns check ho gaye.');
  } catch (err) {
    console.error('Database init error:', err);
  }
}

initDb();

module.exports = pool;
