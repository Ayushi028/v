const db = require('../utils/db');
const { detectSpam } = require('../utils/nlp');

exports.getAll = async (req, res) => {
  try {
    const logs = await db.get('logs') || [];
    console.log(`📊 Fetched ${logs.length} logs`);
    
    res.json({ 
      success: true, 
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('❌ Logs getAll error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

exports.addLog = async (req, res) => {
  try {
    // 🔥 BACKWARDS COMPATIBLE - Handle both formats
    const { phone, message, callerId, transcript } = req.body;
    
    const finalPhone = phone || callerId || `+1-555-${Math.floor(Math.random() * 10000)}`;
    const finalMessage = message || transcript || 'Test call';
    
    // 🔥 YOUR REAL NLP ✅
    const analysis = detectSpam(finalMessage);
    
    const newLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      callerId: finalPhone,
      transcript: finalMessage,
      analysis,
      timestamp: new Date().toISOString()
    };

    // 🔥 SAVE TO DB
    let logs = await db.get('logs') || [];
    logs.unshift(newLog);
    logs = logs.slice(0, 100); // Max 100 logs
    await db.set('logs', logs);

    // 🔥 CONSOLE + PERFECT RESPONSE
    const status = analysis.isSpam ? '🚫 SPAM' : '✅ SAFE';
    console.log(`📞 ${status} | ${finalPhone} | ${analysis.confidence.toFixed(0)}% | ${analysis.reason || 'NLP'}`);
    
    res.json({ 
      success: true, 
      data: newLog,
      message: analysis.isSpam ? '🚫 SPAM DETECTED!' : '✅ SAFE CALL',
      summary: {
        isSpam: analysis.isSpam,
        confidence: analysis.confidence
      }
    });
    
  } catch (error) {
    console.error('❌ Log add error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save log',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};