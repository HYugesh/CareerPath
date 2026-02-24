/**
 * Centralized Gemini AI Client
 * Single source of truth for all Gemini API calls
 * Implements rate limiting, caching, and fallback mechanisms
 * Uses gemini-2.5-flash as primary, gemini-2.5-flash-lite as fallback
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI client once
let genAI = null;
let isInitialized = false;

// Models to try in order of preference
const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

// Simple in-memory cache for responses
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

/**
 * Initialize the Gemini client
 */
const initializeClient = () => {
  if (!isInitialized) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
    isInitialized = true;
  }
  return genAI;
};

/**
 * Aggressive JSON fixer - handles severely malformed AI responses
 */
const aggressiveJSONFix = (text) => {
  try {
    // Step 1: Remove all markdown
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    
    // Step 2: Remove any text before first { or [
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      start = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      start = firstBrace;
    } else if (firstBracket !== -1) {
      start = firstBracket;
    }
    
    if (start === -1) {
      console.error('❌ No JSON start found in response');
      return null;
    }
    
    // Step 3: Find matching end
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);
    
    if (end === -1 || end <= start) {
      console.error('❌ No valid JSON end found');
      return null;
    }
    
    text = text.substring(start, end + 1);
    
    // Step 4: Fix common issues line by line
    const lines = text.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) {
        fixedLines.push(line);
        continue;
      }
      
      // Remove comments
      line = line.replace(/\/\/.*$/, '');
      line = line.replace(/\/\*.*?\*\//g, '');
      
      // Fix unquoted keys: word: -> "word":
      line = line.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
      
      // Fix single quotes to double quotes (but be careful with apostrophes in strings)
      // Only replace single quotes that are clearly string delimiters
      if (line.includes("'")) {
        // Simple heuristic: replace ' with " if it's at start/end of a value
        line = line.replace(/:\s*'([^']*)'/g, ': "$1"');
      }
      
      // Fix unterminated strings - if line has odd number of quotes and ends with comma or nothing
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        // Unterminated string - try to close it
        if (line.trim().endsWith(',')) {
          line = line.replace(/,\s*$/, '",');
        } else if (!line.trim().endsWith('"')) {
          line = line.trimEnd() + '"';
        }
      }
      
      // Remove trailing commas before } or ]
      line = line.replace(/,(\s*[}\]])/g, '$1');
      
      fixedLines.push(line);
    }
    
    text = fixedLines.join('\n');
    
    // Step 5: Balance braces and brackets
    const openBraces = (text.match(/\{/g) || []).length;
    const closeBraces = (text.match(/\}/g) || []).length;
    const openBrackets = (text.match(/\[/g) || []).length;
    const closeBrackets = (text.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    if (openBrackets > closeBrackets) {
      text += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // Add missing closing braces
    if (openBraces > closeBraces) {
      text += '}'.repeat(openBraces - closeBraces);
    }
    
    // Step 6: Final cleanup
    text = text.replace(/,(\s*[}\]])/g, '$1'); // Remove any remaining trailing commas
    text = text.replace(/\n/g, ' '); // Remove line breaks from strings
    text = text.replace(/\r/g, ''); // Remove carriage returns
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    
    // Step 7: Try to parse
    try {
      JSON.parse(text);
      console.log('✅ JSON successfully fixed and validated');
      return text;
    } catch (parseError) {
      console.error('❌ JSON still invalid after fixes:', parseError.message);
      console.error('Problematic JSON (first 500 chars):', text.substring(0, 500));
      return null;
    }
    
  } catch (error) {
    console.error('❌ JSON fixing failed:', error.message);
    return null;
  }
};

/**
 * Get cache key from prompt
 */
const getCacheKey = (prompt, config) => {
  const hash = prompt.substring(0, 100) + JSON.stringify(config || {});
  return hash;
};

/**
 * Check if cached response is valid
 */
const getCachedResponse = (key) => {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

/**
 * Store response in cache
 */
const setCachedResponse = (key, data) => {
  responseCache.set(key, {
    data,
    timestamp: Date.now()
  });

  // Clean old cache entries
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
};

/**
 * Wait for rate limit
 */
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
};

/**
 * Main function to call Gemini API with all optimizations
 * Tries gemini-2.5-flash first, falls back to gemini-2.5-flash-lite
 * @param {string} prompt - The prompt to send
 * @param {object} options - Configuration options
 * @returns {Promise<string>} - The AI response text
 */
const callGemini = async (prompt, options = {}) => {
  const {
    temperature = 0.7,
    maxOutputTokens = 2048, // Reduced from 4096 for efficiency
    useCache = true,
    responseType = 'json', // 'json' or 'text'
    retries = 1
  } = options;

  // Check cache first
  const cacheKey = getCacheKey(prompt, { temperature, maxOutputTokens });
  if (useCache) {
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
  }

  // Initialize client
  const client = initializeClient();
  if (!client) {
    throw new Error('Gemini client not initialized - API key missing');
  }

  // Wait for rate limit
  await waitForRateLimit();

  let lastError = null;

  // Try each model in order
  for (const modelName of MODELS_TO_TRY) {

    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens,
        responseMimeType: responseType === 'json' ? "application/json" : "text/plain"
      }
    });

    // Try with retries for each model
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const result = await model.generateContent({
          contents: [{
            parts: [{ text: prompt }]
          }]
        });

        const response = result.response;
        let text = response.text();

        console.log(`📥 Raw response from ${modelName} (length: ${text.length})`);
        console.log('First 200 chars:', text.substring(0, 200));

        // Clean up JSON responses with aggressive fixing
        if (responseType === 'json') {
          const extracted = aggressiveJSONFix(text);
          
          if (!extracted) {
            console.error(`❌ Failed to extract valid JSON from ${modelName}`);
            throw new Error('Invalid JSON structure from AI');
          }
          
          text = extracted;
          console.log('✅ JSON extracted and validated successfully');
        }

        // Cache successful response
        if (useCache) {
          setCachedResponse(cacheKey, text);
        }

        return text;

      } catch (error) {
        lastError = error;
        const errorMsg = error.message?.substring(0, 100) || 'Unknown error';
        console.log(`❌ ${modelName} error (attempt ${attempt + 1}):`, errorMsg);

        if (error.message?.includes('403') || error.message?.includes('401') || error.message?.includes('expired')) {
          break;
        }

        if (error.message?.includes('429') || error.message?.includes('quota')) {
          break;
        }

        if (error.message?.includes('404')) {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
};

/**
 * Clear the response cache
 */
const clearCache = () => {
  responseCache.clear();
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    size: responseCache.size,
    keys: Array.from(responseCache.keys()).map(k => k.substring(0, 50))
  };
};

module.exports = {
  callGemini,
  clearCache,
  getCacheStats,
  initializeClient,
  MODELS_TO_TRY
};