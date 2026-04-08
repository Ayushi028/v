// ========================================================
// 📦 Dependencies
// ========================================================
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5001; // ✅ Render uses PORT, fallback to 5001 locally
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

// ========================================================
// 📂 In‑Memory Database (temporary)
// ========================================================
let db = {
  keywords: [
    { id: 1, word: 'free money' },
    { id: 2, word: 'lottery' },
    { id: 3, word: 'loan' },
    { id: 4, word: 'IRS' },
    { id: 5, word: 'win' },
    { id: 6, word: 'prize' }
  ],
  logs: []
};

// ========================================================
// 🔥 1. CORS Middleware
// ========================================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ========================================================
// 🔥 2. JSON Parsers
// ========================================================
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ========================================================
// 🔍 Scam Analyzer
// ========================================================
const analyzeCall = (inputData = {}, logId = 'unknown') => {
  try {
    let text = '';
    const possiblePaths = [
      inputData,
      inputData.transcript,
      inputData.text,
      inputData.message,
      inputData.content,
      inputData.data,
      inputData.payload
    ];

    for (let path of possiblePaths) {
      if (typeof path === 'string' && path.trim()) {
        text = path.trim();
        break;
      } else if (typeof path === 'object' && path) {
        const deeperPaths = ['transcript', 'text', 'message', 'content', 'data'];
        for (let deeper of deeperPaths) {
          if (path[deeper] && typeof path[deeper] === 'string' && path[deeper].trim()) {
            text = path[deeper].trim();
            break;
          }
        }
        if (text) break;
      }
    }

    if (!text) {
      return { status: 'SAFE', detectedKeywords: [], confidence: 0, noText: true };
    }

    const detected = [];
    const textLower = text.toLowerCase();
    db.keywords.forEach(keyword => {
      if (textLower.includes(keyword.word.toLowerCase())) {
        detected.push(keyword.word);
      }
    });

    return {
      status: detected.length > 0 ? 'ALERT' : 'SAFE',
      detectedKeywords: detected,
      confidence: Math.round((detected.length / db.keywords.length) * 100),
      textLength: text.length,
      textPreview: text.substring(0, 100)
    };
  } catch (error) {
    return { status: 'ERROR', error: error.message };
  }
};

// ========================================================
// 🔐 Auth Middleware
// ========================================================
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ========================================================
// 🌐 Routes
// ========================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    logsCount: db.logs.length,
    keywordsCount: db.keywords.length
  });
});

// Test scam detection
app.post('/api/test-scam', (req, res) => {
  const analysis = analyzeCall(req.body || {}, 'TEST');
  res.json({
    success: true,
    detected: analysis.detectedKeywords,
    status: analysis.status,
    message: analysis.status === 'ALERT' ? '🚨 SCAM DETECTED!' : '✅ Safe call',
    debug: analysis
  });
});

// Report logs
app.post('/api/logs/report', (req, res) => {
  const log = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    callerId: String(req.body?.callerId || 'UNKNOWN'),
    rawData: req.body,
    analysis: analyzeCall(req.body, Date.now())
  };
  db.logs.unshift(log);
  if (db.logs.length > 200) db.logs.splice(200);
  res.json({ success: true, id: log.id, status: log.analysis.status });
});

// Get logs
app.get('/api/logs', (req, res) => res.json({ data: db.logs }));

// Login
app.post('/api/auth/login', (req, res) => {
  if ((req.body.username || req.body.email) === 'admin' && req.body.password === 'admin123') {
    const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid login' });
  }
});

// Keywords CRUD
app.get('/api/keywords', auth, (req, res) => res.json({ data: db.keywords }));
app.post('/api/keywords', auth, (req, res) => {
  const newKw = { id: Date.now(), word: String(req.body.word || '').trim() };
  if (newKw.word) {
    db.keywords.push(newKw);
    res.json(newKw);
  } else {
    res.status(400).json({ error: 'No word provided' });
  }
});
app.delete('/api/keywords/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const before = db.keywords.length;
  db.keywords = db.keywords.filter(k => k.id !== id);
  res.json({ success: true, deleted: before !== db.keywords.length });
});

// Delete log
app.delete('/api/logs/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const before = db.logs.length;
  db.logs = db.logs.filter(l => l.id !== id);
  res.json({ success: true, deleted: before !== db.logs.length });
});

// ========================================================
// 🚀 Start Server
// ========================================================
app.listen(PORT, () => {
  console.log(`\n🚀 BULLETPROOF SCAM DETECTOR v2.1`);
  console.log(`🌐 Listening on port ${PORT}`);
  console.log(`✅ Health check: /health`);
  console.log(`🧪 Test scam: POST /api/test-scam`);
  console.log(`📱 Report log: POST /api/logs/report`);
  console.log(`🔐 Login: POST /api/auth/login`);
});
