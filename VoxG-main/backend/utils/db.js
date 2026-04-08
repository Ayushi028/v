// utils/db.js - 100% Node.js, ZERO deps
const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, '../db/data.json');

// Ensure database exists
const initDB = async () => {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify({
      users: [],
      keywords: [],
      logs: []
    }, null, 2));
    console.log('📁 Database initialized');
  }
};

const db = {
  async get(collection) {
    await initDB();
    const data = await fs.readFile(DB_FILE, 'utf8');
    const dbData = JSON.parse(data);
    return dbData[collection] || [];
  },

  async set(collection, value) {
    await initDB();
    const data = await fs.readFile(DB_FILE, 'utf8');
    const dbData = JSON.parse(data);
    dbData[collection] = value;
    await fs.writeFile(DB_FILE, JSON.stringify(dbData, null, 2));
  },

  async insert(collection, item) {
    const items = await this.get(collection);
    items.push(item);
    await this.set(collection, items);
  }
};

module.exports = db;