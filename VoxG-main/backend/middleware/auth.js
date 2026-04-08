// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  // Token required
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'No token provided, authorization denied' 
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false, 
      error: 'Token is not valid' 
    });
  }
};

module.exports = auth;