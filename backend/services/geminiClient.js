/**
 * Centralized Gemini AI Client
 * Single source of truth for all Gemini API calls
 * Implements rate limiting, caching, and fallback mechanisms
 * Uses gemini-2.5-flash as primary, gemini-2.5-flash-lite as fallback
 *
 * KEY CHANGE: Separated text and JSON call strategies.
 * - callGeminiText: for long prose/markdown — no JSON parsing, zero parse failures
 * - callGeminiJSON: for small structured data — safe minimal JSON cleaning only
 * - callGemini: unified entry point (backward compatible)
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

// Rate limiting — tracked per model to avoid cross-model collisions
const lastRequestTime = {
  "gemini-2.5-flash": 0,
  "gemini-2.5-flash-lite": 0,
};
const MIN_REQUEST_INTERVAL = 1200; // slightly above 1s to be safe

/**
 * Initialize the Gemini client
 */
const initializeClient = () => {
  if (!isInitialized) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
    isInitialized = true;
  }
  return genAI;
};

/**
 * Minimal JSON cleaner — REPLACES the old aggressiveJSONFix.
 *
 * Only does safe operations:
 *   1. Strips markdown fences (```json ... ```)
 *   2. Trims to first [ or { and last ] or }
 *   3. Removes trailing commas before } or ]
 *
 * Does NOT touch content inside string values (no \n removal, no whitespace
 * collapsing) — that was the root cause of the old parse failures at
 * positions like 11250, 15929 etc.
 *
 * Use this ONLY for small JSON responses with no large text fields inside.
 * For large text content use callGeminiText instead.
 */
const cleanSmallJSON = (text) => {
  try {
    let cleaned = text.trim();

    // Strip ```json ... ``` or ``` ... ``` fences
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();

    // Find first { or [
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");

    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      start = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      start = firstBrace;
    } else if (firstBracket !== -1) {
      start = firstBracket;
    }

    if (start === -1) {
      console.error("❌ No JSON start found in response");
      return null;
    }

    // Find last } or ]
    const lastBrace = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");
    const end = Math.max(lastBrace, lastBracket);

    if (end === -1 || end <= start) {
      console.error("❌ No valid JSON end found");
      return null;
    }

    cleaned = cleaned.substring(start, end + 1);

    // Only remove trailing commas — safe, doesn't touch string content
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

    // Validate
    try {
      JSON.parse(cleaned);
      console.log("✅ JSON cleaned and validated successfully");
      return cleaned;
    } catch (parseError) {
      console.error("❌ JSON still invalid after cleaning:", parseError.message);
      console.error("Problematic JSON (first 500 chars):", cleaned.substring(0, 500));
      return null;
    }
  } catch (error) {
    console.error("❌ JSON cleaning failed:", error.message);
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
    timestamp: Date.now(),
  });

  // Clean old cache entries
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
};

/**
 * Wait for rate limit — per model so primary and fallback
 * don't share the same timer.
 */
const waitForRateLimit = async (modelName) => {
  const now = Date.now();
  const timeSinceLastRequest = now - (lastRequestTime[modelName] || 0);

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime[modelName] = Date.now();
};

/**
 * Core internal function — shared by callGemini, callGeminiText, callGeminiJSON.
 * Not exported directly.
 */
const _callGeminiInternal = async (prompt, options = {}) => {
  const {
    temperature = 0.7,
    maxOutputTokens = 2048,
    useCache = true,
    responseType = "json", // 'json' or 'text'
    retries = 1,
  } = options;

  // Check cache first
  const cacheKey = getCacheKey(prompt, { temperature, maxOutputTokens, responseType });
  if (useCache) {
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
  }

  // Initialize client
  const client = initializeClient();
  if (!client) {
    throw new Error("Gemini client not initialized - API key missing");
  }

  let lastError = null;

  // Try each model in order
  for (const modelName of MODELS_TO_TRY) {
    // Per-model rate limiting
    await waitForRateLimit(modelName);

    // Use native JSON mime type when requesting JSON — Gemini will constrain
    // its output to valid JSON, which is more reliable than post-processing.
    // Use text/plain for prose — avoids Gemini wrapping content in JSON.
    const responseMimeType =
      responseType === "json" ? "application/json" : "text/plain";

    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens,
        responseMimeType,
      },
    });

    // Try with retries for each model
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }

        const result = await model.generateContent({
          contents: [{ parts: [{ text: prompt }] }],
        });

        const response = result.response;
        let text = response.text();

        console.log(`📥 Raw response from ${modelName} (length: ${text.length})`);
        console.log("First 200 chars:", text.substring(0, 200));

        if (responseType === "json") {
          // Use the safe minimal cleaner — NOT the old aggressive fixer
          const extracted = cleanSmallJSON(text);

          if (!extracted) {
            console.error(`❌ Failed to extract valid JSON from ${modelName}`);
            throw new Error("Invalid JSON structure from AI");
          }

          text = extracted;
        }
        // For responseType === 'text', return as-is — no processing needed

        // Cache successful response
        if (useCache) {
          setCachedResponse(cacheKey, text);
        }

        return text;
      } catch (error) {
        lastError = error;
        const errorMsg = error.message?.substring(0, 100) || "Unknown error";
        console.log(`❌ ${modelName} error (attempt ${attempt + 1}):`, errorMsg);

        // Don't retry on fatal errors
        if (
          error.message?.includes("403") ||
          error.message?.includes("401") ||
          error.message?.includes("expired")
        ) {
          break;
        }

        if (
          error.message?.includes("429") ||
          error.message?.includes("quota")
        ) {
          break;
        }

        if (error.message?.includes("404")) {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models failed");
};

/**
 * callGemini — main unified entry point (backward compatible).
 * All existing callers continue to work without any changes.
 */
const callGemini = async (prompt, options = {}) => {
  return _callGeminiInternal(prompt, options);
};

/**
 * callGeminiText — use for any prompt that returns long prose or markdown.
 * Examples: subtopic explanations, article content, detailed descriptions.
 *
 * Returns raw text string. No JSON parsing attempted — zero parse failures.
 */
const callGeminiText = async (prompt, options = {}) => {
  return _callGeminiInternal(prompt, {
    ...options,
    responseType: "text",
    useCache: options.useCache ?? false,
  });
};

/**
 * callGeminiJSON — use ONLY when JSON field values are small (no long text).
 * Examples: subtopic metadata, code examples list, quiz questions, key takeaways.
 *
 * Do NOT use when any JSON field value contains hundreds of words —
 * use callGeminiText for that content instead.
 *
 * Returns a JSON string. Caller must JSON.parse() it.
 */
const callGeminiJSON = async (prompt, options = {}) => {
  return _callGeminiInternal(prompt, {
    ...options,
    responseType: "json",
    useCache: options.useCache ?? false,
  });
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
    keys: Array.from(responseCache.keys()).map((k) => k.substring(0, 50)),
  };
};

module.exports = {
  callGemini,        // backward compatible — existing code needs no changes
  callGeminiText,    // NEW — use for long prose/markdown content
  callGeminiJSON,    // NEW — use for small structured JSON only
  clearCache,
  getCacheStats,
  initializeClient,
  MODELS_TO_TRY,
};