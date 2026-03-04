/**
 * Output Comparator Utility
 * Compares program output with expected output from test cases
 * Handles both JSON and plain text outputs
 */

/**
 * Compare actual output with expected output
 * @param {string} actual - Actual output from code execution (stdout)
 * @param {any} expected - Expected output value
 * @returns {boolean} - True if outputs match, false otherwise
 * 
 * @example
 * compareOutput("[0,1]", "[0,1]")           // true
 * compareOutput("[0,1]\n", "[0,1]")         // true
 * compareOutput(" [0,1] ", "[0,1]")         // true
 * compareOutput("42", "42")                 // true
 * compareOutput("hello", "hello")           // true
 * compareOutput("[1,2,3]", "[1, 2, 3]")     // true (JSON normalized)
 */
function compareOutput(actual, expected) {
  // Step 1: Trim leading and trailing whitespace
  const trimmedActual = String(actual).trim();
  const trimmedExpected = String(expected).trim();
  
  // Step 2: Try JSON comparison if outputs look like JSON
  // Check if both strings start with [ or { (common JSON indicators)
  const looksLikeJSON = (str) => {
    const firstChar = str.charAt(0);
    return firstChar === '[' || firstChar === '{';
  };
  
  if (looksLikeJSON(trimmedActual) || looksLikeJSON(trimmedExpected)) {
    try {
      // Attempt to parse both as JSON
      const parsedActual = JSON.parse(trimmedActual);
      const parsedExpected = JSON.parse(trimmedExpected);
      
      // Compare using JSON.stringify for normalized comparison
      // This handles different spacing: [0,1] vs [0, 1]
      return JSON.stringify(parsedActual) === JSON.stringify(parsedExpected);
    } catch (error) {
      // JSON parsing failed, fall through to string comparison
      // This is expected for non-JSON outputs
    }
  }
  
  // Step 3: Fallback to simple string comparison
  return trimmedActual === trimmedExpected;
}

module.exports = {
  compareOutput
};
