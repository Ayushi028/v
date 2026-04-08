// Simple keyword-based spam detection (for prototype)
const spamKeywords = ['lottery', 'prize', 'loan', 'free money', 'win', 'guaranteed'];

const detectSpam = (transcript) => {
  const lowerText = transcript.toLowerCase();
  const matched = spamKeywords.filter(keyword => 
    lowerText.includes(keyword)
  );
  
  return {
    isSpam: matched.length > 0,
    matchedKeywords: matched,
    confidence: Math.round((matched.length / spamKeywords.length) * 100)
  };
};

module.exports = { detectSpam };