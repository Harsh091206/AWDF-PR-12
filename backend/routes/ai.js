const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// In-memory rate limiting map: clientIp -> lastRequestTimestamp
const rateLimitMap = new Map();

router.post('/generate-description', async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  // Supplementary Problem 2: Rate limiting (e.g., max 1 request every 5 seconds per client)
  const clientIp = req.ip || req.connection.remoteAddress || 'client';
  const now = Date.now();
  const lastRequestTime = rateLimitMap.get(clientIp);

  if (lastRequestTime && now - lastRequestTime < 5000) {
    return res.status(429).json({
      description: `Draft description for "${title}": Complete the planned action items and update status upon review.`,
      fallback: true,
      message: 'Rate limit: Please wait a few seconds before requesting AI suggestions again.'
    });
  }
  rateLimitMap.set(clientIp, now);

  let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    apiKey = apiKey.replace(/["']/g, '').trim();
  }

  // Graceful degradation: Check if API key is provided
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(200).json({
      description: `Organize action items, allocate required resources, and complete milestones for "${title}".`,
      fallback: true,
      message: 'Notice: GEMINI_API_KEY not configured or invalid. Fallback description provided.'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Write a concise, professional, 1 to 2 sentence task description for a task titled: "${title}". Return only the description without quotes or conversation.`;

    let text = '';
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
      const result = await model.generateContent(prompt);
      text = result.response.text().trim();
    } catch {
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const result = await model.generateContent(prompt);
      text = result.response.text().trim();
    }

    return res.json({
      description: text,
      fallback: false
    });
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    // Graceful degradation on API failure/timeout/bad key
    return res.status(200).json({
      description: `Draft description for "${title}": Review objectives, coordinate deliverables, and update task progress.`,
      fallback: true,
      message: 'AI service temporarily unavailable. Fallback description provided.'
    });
  }
});

module.exports = router;
