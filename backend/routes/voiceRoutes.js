const express = require('express');
const multer = require('multer');
const voiceService = require('../services/voiceService');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper's limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// POST /api/voice/transcribe - Convert speech to text
router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file provided' 
      });
    }

    const result = await voiceService.transcribeAudio(
      req.file.buffer, 
      req.file.originalname
    );

    res.json(result);
  } catch (error) {
    console.error('Transcription route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio',
      details: error.message
    });
  }
});

// POST /api/voice/speak - Convert text to speech
router.post('/speak', auth, async (req, res) => {
  try {
    const { text, voice = 'alloy' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No text provided'
      });
    }

    if (text.length > 4096) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 4096 characters)'
      });
    }

    const result = await voiceService.generateSpeech(text, voice);

    if (result.success) {
      res.set({
        'Content-Type': result.contentType,
        'Content-Length': result.audioBuffer.length,
        'Cache-Control': 'public, max-age=3600'
      });
      res.send(result.audioBuffer);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('TTS route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate speech',
      details: error.message
    });
  }
});

// POST /api/voice/enhance - Enhance transcript using Gemini
router.post('/enhance', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No text provided'
      });
    }

    const result = await voiceService.enhanceTranscript(text);
    res.json(result);
  } catch (error) {
    console.error('Text enhancement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance text'
    });
  }
});

// POST /api/voice/questions - Generate interview questions using Gemini
router.post('/questions', auth, async (req, res) => {
  try {
    const { role, experience, count = 5 } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const result = await voiceService.generateInterviewQuestions(role, experience, count);
    res.json(result);
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate questions'
    });
  }
});

// GET /api/voice/status - Check voice service availability
router.get('/status', auth, async (req, res) => {
  try {
    const status = voiceService.getServiceStatus();
    
    res.json({
      success: true,
      services: status,
      message: status.gemini 
        ? 'Gemini AI services available with browser voice features' 
        : 'Using browser-only voice services'
    });
  } catch (error) {
    console.error('Voice status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check voice service status'
    });
  }
});

module.exports = router;