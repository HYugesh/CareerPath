const dotenv = require('dotenv');
dotenv.config();

/**
 * OpenAI Client for Roadmap Generation (Fallback)
 * Used when Gemini API fails
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate roadmap using OpenAI GPT-4
 * @param {string} prompt - The prompt for roadmap generation
 * @returns {Promise<string>} - JSON string response
 */
async function generateRoadmapWithOpenAI(prompt) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to .env file');
  }

  try {
    console.log('🤖 Calling OpenAI GPT-4 for roadmap generation...');
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content: 'You are an expert Learning Architect, Career Mentor, and Technical Interviewer. Generate comprehensive, structured learning roadmaps in valid JSON format. Focus on practical mastery, progressive difficulty, and job-readiness. Output ONLY valid JSON - no markdown, explanations, or extra text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" } // Force JSON response
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    console.log('✅ OpenAI response received, length:', content.length);
    return content;

  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    throw error;
  }
}

/**
 * Aggressive JSON fix for OpenAI responses (similar to Gemini)
 * @param {string} text - Raw text that might contain JSON
 * @returns {object} - Parsed JSON object
 */
function fixOpenAIJSON(text) {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    console.log('⚠️ OpenAI JSON needs fixing...');
    
    // Remove markdown code blocks
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON boundaries
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    // Try parsing again
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error('❌ Could not fix OpenAI JSON:', e2.message);
      throw new Error('Invalid JSON from OpenAI');
    }
  }
}

module.exports = {
  generateRoadmapWithOpenAI,
  fixOpenAIJSON
};
