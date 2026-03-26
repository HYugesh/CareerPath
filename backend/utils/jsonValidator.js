/**
 * JSON Validation Utility
 * Handles JSON parsing with markdown stripping and error handling
 */

/**
 * Validate and parse JSON response from AI services
 * Strips markdown code blocks and handles parsing errors
 * @param {string} responseText - Raw response text from AI
 * @param {string} context - Context for error logging (e.g., "Phase 1 metadata")
 * @returns {Object} Parsed JSON object or throws structured error
 */
function validateAndParseJSON(responseText, context = 'JSON parsing') {
  if (!responseText || typeof responseText !== 'string') {
    const error = new Error('Invalid response: empty or non-string response');
    error.context = context;
    error.rawResponse = responseText;
    throw error;
  }

  // Strip markdown code blocks
  let cleanedText = responseText.trim();
  
  // Remove ```json or ``` at the start
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.substring(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.substring(3);
  }
  
  // Remove ``` at the end
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.substring(0, cleanedText.length - 3);
  }
  
  cleanedText = cleanedText.trim();

  // Attempt to parse JSON
  try {
    const parsed = JSON.parse(cleanedText);
    console.log(`[JSON Validator] Successfully parsed JSON for ${context}`);
    return parsed;
  } catch (parseError) {
    // Log the error with context
    console.error(`[JSON Validator] Parse error in ${context}:`, parseError.message);
    console.error(`[JSON Validator] Raw response (first 500 chars):`, responseText.substring(0, 500));
    console.error(`[JSON Validator] Cleaned text (first 500 chars):`, cleanedText.substring(0, 500));
    
    // Create structured error
    const error = new Error(`JSON parsing failed for ${context}: ${parseError.message}`);
    error.context = context;
    error.rawResponse = responseText;
    error.cleanedResponse = cleanedText;
    error.parseError = parseError;
    
    throw error;
  }
}

/**
 * Validate JSON structure matches expected schema
 * @param {Object} data - Parsed JSON data
 * @param {Object} schema - Expected schema definition
 * @param {string} context - Context for error logging
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateJSONStructure(data, schema, context = 'Structure validation') {
  if (!data || typeof data !== 'object') {
    const error = new Error(`Invalid data structure for ${context}: not an object`);
    error.context = context;
    error.data = data;
    throw error;
  }

  // Check required fields
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in data)) {
        const error = new Error(`Missing required field "${field}" in ${context}`);
        error.context = context;
        error.missingField = field;
        error.data = data;
        throw error;
      }
    }
  }

  // Check field types
  if (schema.fields) {
    for (const [field, expectedType] of Object.entries(schema.fields)) {
      if (field in data) {
        const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
        if (actualType !== expectedType) {
          const error = new Error(`Invalid type for field "${field}" in ${context}: expected ${expectedType}, got ${actualType}`);
          error.context = context;
          error.field = field;
          error.expectedType = expectedType;
          error.actualType = actualType;
          throw error;
        }
      }
    }
  }

  console.log(`[JSON Validator] Structure validation passed for ${context}`);
  return true;
}

/**
 * Safe JSON parse with fallback
 * @param {string} text - Text to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed JSON or fallback value
 */
function safeJSONParse(text, fallback = null) {
  try {
    return validateAndParseJSON(text, 'Safe parse');
  } catch (error) {
    console.warn('[JSON Validator] Safe parse failed, returning fallback:', error.message);
    return fallback;
  }
}

module.exports = {
  validateAndParseJSON,
  validateJSONStructure,
  safeJSONParse
};
