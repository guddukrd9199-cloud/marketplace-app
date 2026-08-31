const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database.sqlite');
const dbExists = fs.existsSync(dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Agar database file nayi bani hai (pehli baar), schema run karo
if (!dbExists) {
  console.log('Nayi database mil rahi hai, schema create kar rahe hain...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('Schema successfully create ho gaya!');
} else {
  // Extra safety: agar file hai lekin tables nahi hain, tab bhi schema run karo
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (!tableCheck) {
    console.log('Tables missing hain, schema create kar rahe hain...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('Schema successfully create ho gaya!');
  }
}

module.exports = db;
