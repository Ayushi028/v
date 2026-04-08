const db = require('../utils/db');

exports.getAll = async (req, res) => {
  try {
    const keywords = await db.get('keywords');
    res.json({ success: true, data: keywords });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
};

exports.addKeyword = async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) return res.status(400).json({ error: 'Word required' });
    
    const keywords = await db.get('keywords');
    const newKeyword = { id: Date.now().toString(), word, createdAt: new Date().toISOString() };
    keywords.push(newKeyword);
    await db.set('keywords', keywords);
    
    res.json({ success: true, data: newKeyword });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add keyword' });
  }
};