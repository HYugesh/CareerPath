/**
 * Retry Helper Utility
 * Implements exponential backoff retry logic for async operations
 */

/**
 * Retry an async function with exponential backoff
 * @param {Function} asyncFn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {string} options.context - Context for logging (default: 'Operation')
 * @param {Function} options.shouldRetry - Function to determine if error should trigger retry
 * @returns {Promise<*>} Result of the async function
 */
async function retryWithBackoff(asyncFn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    context = 'Operation',
    shouldRetry = () => true
  } = options;

  let lastError;
  const errors = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Retry Helper] ${context}: Attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const result = await asyncFn();
      
      if (attempt > 0) {
        console.log(`[Retry Helper] ${context}: Succeeded on attempt ${attempt + 1}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      errors.push({
        attempt: attempt + 1,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      console.error(`[Retry Helper] ${context}: Attempt ${attempt + 1} failed:`, error.message);

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        console.log(`[Retry Helper] ${context}: Error not retryable, throwing immediately`);
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`[Retry Helper] ${context}: All ${maxRetries + 1} attempts failed`);
        
        // Create aggregated error with all attempt details
        const aggregatedError = new Error(
          `${context} failed after ${maxRetries + 1} attempts: ${lastError.message}`
        );
        aggregatedError.attempts = errors;
        aggregatedError.lastError = lastError;
        aggregatedError.context = context;
        
        throw aggregatedError;
      }

      // Calculate delay with exponential backoff: initialDelay * 2^attempt
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      console.log(`[Retry Helper] ${context}: Waiting ${delay}ms before retry ${attempt + 2}...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Retry with custom backoff strategy
 * @param {Function} asyncFn - Async function to retry
 * @param {Array<number>} delays - Array of delays in milliseconds for each retry
 * @param {string} context - Context for logging
 * @returns {Promise<*>} Result of the async function
 */
async function retryWithCustomDelays(asyncFn, delays, context = 'Operation') {
  let lastError;
  const maxAttempts = delays.length + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`[Retry Helper] ${context}: Attempt ${attempt + 1}/${maxAttempts}`);
      
      const result = await asyncFn();
      
      if (attempt > 0) {
        console.log(`[Retry Helper] ${context}: Succeeded on attempt ${attempt + 1}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`[Retry Helper] ${context}: Attempt ${attempt + 1} failed:`, error.message);

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        console.error(`[Retry Helper] ${context}: All ${maxAttempts} attempts failed`);
        throw error;
      }

      const delay = delays[attempt];
      console.log(`[Retry Helper] ${context}: Waiting ${delay}ms before retry ${attempt + 2}...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry only on specific error types
 * @param {Function} asyncFn - Async function to retry
 * @param {Array<string>} retryableErrors - Array of error messages or patterns to retry on
 * @param {Object} options - Retry options (same as retryWithBackoff)
 * @returns {Promise<*>} Result of the async function
 */
async function retryOnSpecificErrors(asyncFn, retryableErrors, options = {}) {
  const shouldRetry = (error) => {
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(pattern => 
      errorMessage.includes(pattern.toLowerCase())
    );
  };

  return retryWithBackoff(asyncFn, {
    ...options,
    shouldRetry
  });
}

module.exports = {
  retryWithBackoff,
  retryWithCustomDelays,
  retryOnSpecificErrors
};
