const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Models to try in order of preference
const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

class VoiceService {
  constructor() {
    this.hasGemini = !!process.env.GEMINI_API_KEY;
    this.currentModelIndex = 0;
    
    if (this.hasGemini) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.initializeModel();
        console.log('✅ Gemini Voice Service initialized');
      } catch (error) {
        console.warn('⚠️ Gemini initialization failed:', error.message);
        this.hasGemini = false;
      }
    } else {
      console.log('ℹ️ Gemini API key not found. Voice service will use browser-only methods.');
    }
  }

  initializeModel() {
    const modelName = MODELS_TO_TRY[this.currentModelIndex];
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    console.log(`🤖 Using model: ${modelName}`);
  }

  async callWithFallback(prompt) {
    for (let i = 0; i < MODELS_TO_TRY.length; i++) {
      const modelName = MODELS_TO_TRY[i];
      try {
        console.log(`🤖 Trying model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log(`✅ Success with ${modelName}`);
        return response.text();
      } catch (error) {
        console.log(`❌ ${modelName} failed:`, error.message?.substring(0, 100));
        if (i === MODELS_TO_TRY.length - 1) {
          throw error; // All models failed
        }
      }
    }
  }

  async transcribeAudio(audioBuffer, filename = 'audio.wav') {
    // For now, we'll use browser-based speech recognition
    // Gemini doesn't have direct audio transcription like Whisper
    return this.transcribeAudioFallback(audioBuffer);
  }

  async generateSpeech(text, voice = 'alloy') {
    // Gemini doesn't have direct TTS, so we'll use browser-based TTS
    return {
      success: false,
      error: 'Using browser text-to-speech. Server-side TTS not available with Gemini.'
    };
  }

  // Fallback method - use browser speech recognition
  async transcribeAudioFallback(audioBuffer) {
    return {
      success: false,
      error: 'Please use browser speech recognition. Server-side transcription requires additional setup.',
      text: ''
    };
  }

  // Enhanced text processing using Gemini
  async enhanceTranscript(text) {
    if (!this.hasGemini || !text) {
      return { success: false, text };
    }

    try {
      const prompt = `Please clean up and improve this transcript, fixing any grammar issues and making it more readable while preserving the original meaning:

"${text}"

Return only the improved text without any additional commentary.`;

      const enhancedText = await this.callWithFallback(prompt);

      return {
        success: true,
        text: enhancedText.trim()
      };
    } catch (error) {
      console.error('Text enhancement error:', error);
      return {
        success: false,
        text: text
      };
    }
  }

  // Generate interview questions using Gemini
  async generateInterviewQuestions(role, experience, count = 5) {
    if (!this.hasGemini) {
      return {
        success: false,
        error: 'Gemini API not available'
      };
    }

    try {
      const prompt = `Generate ${count} interview questions for a ${role} position with ${experience} experience level. 
      
      Return the questions in JSON format like this:
      {
        "questions": [
          {
            "question": "Question text here",
            "type": "behavioral|technical|situational",
            "difficulty": "easy|medium|hard"
          }
        ]
      }`;

      const text = await this.callWithFallback(prompt);
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          questions: questions.questions || []
        };
      }
      
      return {
        success: false,
        error: 'Failed to parse questions'
      };
    } catch (error) {
      console.error('Question generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if Gemini services are available
  isGeminiAvailable() {
    return this.hasGemini;
  }

  // Get service status
  getServiceStatus() {
    return {
      gemini: this.hasGemini,
      textEnhancement: this.hasGemini,
      questionGeneration: this.hasGemini,
      browserSTT: true,
      browserTTS: true,
      serverSTT: false, // Would need Google Speech-to-Text API
      serverTTS: false  // Would need Google Text-to-Speech API
    };
  }
}

module.exports = new VoiceService();