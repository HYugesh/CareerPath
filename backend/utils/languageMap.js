/**
 * Language Mapping Utility
 * Maps IDE language names to Judge0 language IDs
 * Reference: https://ce.judge0.com/languages
 */

/**
 * Language ID mapping for Judge0 API
 * Maps common language names to their corresponding Judge0 language IDs
 */
const languageMap = {
  // JavaScript
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  js: 63,
  
  // Python
  python: 71,      // Python (3.8.1)
  py: 71,
  
  // Java
  java: 62,        // Java (OpenJDK 13.0.1)
  
  // C++
  cpp: 54,         // C++ (GCC 9.2.0)
  'c++': 54,
  
  // C
  c: 50,           // C (GCC 9.2.0)
  
  // C#
  csharp: 51,      // C# (Mono 6.6.0.161)
  'c#': 51,
  cs: 51,
  
  // Ruby
  ruby: 72,        // Ruby (2.7.0)
  rb: 72,
  
  // Go
  go: 60,          // Go (1.13.5)
  golang: 60,
  
  // Rust
  rust: 73,        // Rust (1.40.0)
  rs: 73,
  
  // PHP
  php: 68,         // PHP (7.4.1)
  
  // TypeScript
  typescript: 74,  // TypeScript (3.7.4)
  ts: 74,
  
  // Swift
  //swift: 83,       // Swift (5.2.3)
  
  // Kotlin
  kotlin: 78,      // Kotlin (1.3.70)
  kt: 78,
  
  // R
  r: 80,           // R (4.0.0)
  
  // Perl
  //perl: 85,        // Perl (5.28.1)
  
  // Scala
  //scala: 81        // Scala (2.13.2)
};

/**
 * Get Judge0 language ID from language name
 * @param {string} language - Language name (case-insensitive)
 * @returns {number|null} - Judge0 language ID or null if not found
 */
function getLanguageId(language) {
  if (!language) return null;
  
  const normalizedLanguage = language.toLowerCase().trim();
  return languageMap[normalizedLanguage] || null;
}

/**
 * Check if a language is supported
 * @param {string} language - Language name
 * @returns {boolean} - True if language is supported
 */
function isLanguageSupported(language) {
  return getLanguageId(language) !== null;
}

/**
 * Get all supported languages
 * @returns {string[]} - Array of supported language names
 */
function getSupportedLanguages() {
  return Object.keys(languageMap);
}

module.exports = {
  languageMap,
  getLanguageId,
  isLanguageSupported,
  getSupportedLanguages
};
