const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { callGeminiText } = require('../services/geminiClient');

// POST /api/chatbot/ask
router.post('/ask', auth, async (req, res) => {
  const { message, context } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    const systemContext = context
      ? `You are a helpful AI learning assistant for a coding education platform called CareerPath.
The user is currently studying: ${context.topic || 'programming'}.
${context.module ? `Current module: ${context.module}` : ''}
${context.subtopic ? `Current subtopic: ${context.subtopic}` : ''}

Answer clearly and concisely. Use simple language suitable for learners.
Format your response with proper structure — use bullet points for lists, short paragraphs for explanations.
Keep responses focused and under 300 words unless a detailed explanation is truly needed.`
      : `You are a helpful AI learning assistant for a coding education platform called CareerPath.
Answer programming and computer science questions clearly and concisely.
Use simple language suitable for learners. Keep responses under 300 words.`;

    const prompt = `${systemContext}\n\nUser question: ${message}`;

    const response = await callGeminiText(prompt, {
      temperature: 0.7,
      maxOutputTokens: 1024,
      useCache: false,
    });

    res.json({ success: true, response });
  } catch (error) {
    console.error('[CHATBOT] Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get AI response' });
  }
});

module.exports = router;
