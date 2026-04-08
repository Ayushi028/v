// utils/seed.js - FIXED FOR LowDB
const bcrypt = require('bcryptjs');
const db = require('./db');

const seedData = async () => {
  console.log('🌱 Seeding LowDB...');
  
  // 👈 CREATE ADMIN USER
  const users = await db.get('users');
  const adminExists = users.find(u => u.email === 'admin@voxguard.com');
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.insert('users', {
      id: '1',
      email: 'admin@voxguard.com',
      password: hashedPassword
    });
    console.log('✅ Admin created: admin@voxguard.com');
  }
  
  // 👈 KEYWORDS
  const keywords = await db.get('keywords');
  if (keywords.length === 0) {
    await db.set('keywords', [
      'lottery', 'prize', 'free money', 'loan approved', 'win now'
    ]);
    console.log('✅ Keywords seeded');
  }
  
  // 👈 DEMO LOGS
  const logs = await db.get('logs');
  if (logs.length === 0) {
    await db.insert('logs', {
      id: 'demo1',
      callerId: '+1-555-1234',
      transcript: 'You won lottery prize!',
      analysis: { isSpam: true, confidence: 66 },
      timestamp: new Date().toISOString()
    });
    console.log('✅ Demo log seeded');
  }
  
  console.log('✅ LowDB seeded!');
};

module.exports = seedData;