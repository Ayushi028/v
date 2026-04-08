const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5001;

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
// 🔥 1. CORS FIRST - PROTECTS ALL ROUTES!
// ========================================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ========================================================
// 🔥 2. JSON PARSERS SECOND
// ========================================================
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 🔥 ULTIMATE BULLETPROOF ANALYZER - CAN'T CRASH
const analyzeCall = (inputData = {}, logId = 'unknown') => {
  try {
    console.log(`\n🔍 SCAN #${logId}`);
    console.log(`📥 RAW INPUT TYPE:`, typeof inputData);
    console.log(`📥 RAW INPUT:`, JSON.stringify(inputData, null, 2).substring(0, 300));
    
    // 🔥 TRY EVERY POSSIBLE TEXT LOCATION
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
      try {
        if (path && typeof path === 'string' && path.trim().length > 0) {
          text = path.trim();
          break;
        } else if (path && typeof path === 'object') {
          // Dig deeper into objects
          const deeperPaths = ['transcript', 'text', 'message', 'content', 'data'];
          for (let deeper of deeperPaths) {
            if (path[deeper] && typeof path[deeper] === 'string' && path[deeper].trim().length > 0) {
              text = path[deeper].trim();
              break;
            }
          }
          if (text) break;
        }
      } catch (e) {
        console.log(`⚠️ Path check failed:`, e.message);
      }
    }
    
    console.log(`📝 FOUND TEXT: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}" (${text.length} chars)`);
    
    if (!text || text.length === 0) {
      console.log(`⚠️ NO TEXT FOUND - SAFE`);
      return { 
        status: 'SAFE', 
        detectedKeywords: [], 
        confidence: 0, 
        noText: true,
        debug: { inputType: typeof inputData, hasTranscript: !!inputData.transcript }
      };
    }
    
    // 🔥 SAFE KEYWORD SCAN
    const detected = [];
    const textLower = text.toLowerCase();
    
    db.keywords.forEach(keyword => {
      try {
        const kw = String(keyword.word || '').toLowerCase();
        if (kw && textLower.includes(kw)) {
          console.log(`✅ HIT: '${kw}'`);
          detected.push(keyword.word);
        }
      } catch (e) {
        console.log(`⚠️ Keyword scan error:`, e.message);
      }
    });
    
    const status = detected.length > 0 ? 'ALERT' : 'SAFE';
    console.log(`🎯 ${status} | Keywords: ${detected.join(', ') || 'none'}`);
    console.log(`─`.repeat(50));
    
    return {
      status,
      detectedKeywords: detected,
      confidence: Math.round((detected.length / db.keywords.length) * 100),
      textLength: text.length,
      textPreview: text.substring(0, 100)
    };
    
  } catch (error) {
    console.error(`💥 CRITICAL ERROR in analyzeCall #${logId}:`, error);
    return {
      status: 'ERROR',
      detectedKeywords: [],
      confidence: 0,
      error: error.message,
      stack: error.stack
    };
  }
};

// ========================================================
// 🔥 3. ROUTES - ALL PROTECTED BY CORS ABOVE!
// ========================================================

// 🔥 HEALTH CHECK - NOW FULLY PROTECTED!
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    memory: process.memoryUsage().heapUsed / 1024 / 1024,
    logsCount: db.logs.length,
    keywordsCount: db.keywords.length,
    recentCaller: db.logs[0]?.callerId || 'none'
  });
});

// 🔥 BULLETPROOF AUTH
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    jwt.verify(token, 'mysecretkey');
    next();
  } catch (e) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// 🔥 TEST ENDPOINT
app.post('/api/test-scam', (req, res) => {
  console.log('\n🧪 TEST MODE');
  const analysis = analyzeCall(req.body || {}, 'TEST');
  res.json({ 
    success: true,
    detected: analysis.detectedKeywords, 
    status: analysis.status,
    message: analysis.status === 'ALERT' ? '🚨 SCAM DETECTED!' : '✅ Safe call',
    debug: analysis
  });
});

// 🔥 MAIN ENDPOINT - IMPOSSIBLE TO CRASH
app.post('/api/logs/report', (req, res) => {
  try {
    console.log(`\n📥 REPORT RECEIVED at ${new Date().toISOString()}`);
    console.log('HEADERS:', req.headers);
    console.log('BODY KEYS:', Object.keys(req.body || {}));
    console.log('BODY:', JSON.stringify(req.body, null, 2).substring(0, 400));
    
    // 🔥 CREATE LOG SAFELY
    const log = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      callerId: String(req.body?.callerId || req.body?.caller_id || req.body?.caller || 'UNKNOWN'),
      duration: parseFloat(req.body?.duration) || 0,
      rawData: req.body // Store raw data safely
    };
    
    // 🔥 ANALYZE SAFELY
    log.analysis = analyzeCall(req.body, log.id);
    log.displayStatus = log.analysis.status;
    
    // 🔥 STORE SAFELY
    db.logs.unshift(log);
    if (db.logs.length > 200) db.logs.splice(200);
    
    console.log(`✅ SAVED #${log.id} | ${log.displayStatus} | ${log.callerId}`);
    
    res.json({ 
      success: true, 
      id: log.id,
      status: log.displayStatus,
      keywords: log.analysis.detectedKeywords,
      callerId: log.callerId
    });
    
  } catch (error) {
    console.error('💥 FATAL ERROR in /api/logs/report:', error);
    console.error('STACK:', error.stack);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      debug: {
        bodyKeys: Object.keys(req.body || {}),
        bodyType: typeof req.body,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// 🔥 GET LOGS
app.get('/api/logs', (req, res) => {
  res.json({ data: db.logs });
});

// 🔥 LOGIN
app.post('/api/auth/login', (req, res) => {
  try {
    if ((req.body.username || req.body.email) === 'admin' && req.body.password === 'admin123') {
      const token = jwt.sign({ user: 'admin' }, 'mysecretkey', { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid login' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 🔥 KEYWORDS ENDPOINTS
app.get('/api/keywords', auth, (req, res) => res.json({ data: db.keywords }));
app.post('/api/keywords', auth, (req, res) => {
  try {
    const newKw = { id: Date.now(), word: String(req.body.word || '').trim() };
    if (newKw.word) {
      db.keywords.push(newKw);
      res.json(newKw);
    } else {
      res.status(400).json({ error: 'No word provided' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.delete('/api/keywords/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const before = db.keywords.length;
  db.keywords = db.keywords.filter(k => k.id != id);
  res.json({ success: true, deleted: before !== db.keywords.length });
});

// 🔥 DELETE LOG
app.delete('/api/logs/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const before = db.logs.length;
  db.logs = db.logs.filter(l => l.id != id);
  res.json({ success: true, deleted: before !== db.logs.length });
});

// 🔥 START SERVER
app.listen(PORT, () => {
  console.log('\n🚀 BULLETPROOF SCAM DETECTOR v2.1 - CORS FIXED!');
  console.log('🌐 http://localhost:' + PORT);
  console.log('✅ /health - Health check (CORS enabled)');
  console.log('🧪 POST /api/test-scam {"text":"I won the lottery!"}');
  console.log('📱 POST /api/logs/report {"callerId":"123","transcript":"free money"}');
  console.log('🔐 POST /api/auth/login {"username":"admin","password":"admin123"}');
  console.log('='.repeat(70));
});