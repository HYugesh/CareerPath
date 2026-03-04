/**
 * Output Comparator Tests
 * Demonstrates the compareOutput utility with various test cases
 */

const { compareOutput } = require('./outputComparator');

console.log('Testing Output Comparator Utility\n');
console.log('='.repeat(50));

// Test cases
const tests = [
  // JSON array comparisons
  { actual: '[0,1]', expected: '[0,1]', shouldMatch: true, description: 'Exact JSON array match' },
  { actual: '[0,1]\n', expected: '[0,1]', shouldMatch: true, description: 'JSON array with trailing newline' },
  { actual: ' [0,1] ', expected: '[0,1]', shouldMatch: true, description: 'JSON array with surrounding whitespace' },
  { actual: '[0, 1]', expected: '[0,1]', shouldMatch: true, description: 'JSON array with different spacing' },
  { actual: '[1,2,3]', expected: '[1, 2, 3]', shouldMatch: true, description: 'JSON array spacing normalization' },
  
  // JSON object comparisons
  { actual: '{"a":1,"b":2}', expected: '{"a":1,"b":2}', shouldMatch: true, description: 'Exact JSON object match' },
  { actual: '{"a": 1, "b": 2}', expected: '{"a":1,"b":2}', shouldMatch: true, description: 'JSON object spacing normalization' },
  
  // Plain string comparisons
  { actual: '42', expected: '42', shouldMatch: true, description: 'Simple number string' },
  { actual: 'hello', expected: 'hello', shouldMatch: true, description: 'Simple text string' },
  { actual: 'hello\n', expected: 'hello', shouldMatch: true, description: 'Text with trailing newline' },
  { actual: '  hello  ', expected: 'hello', shouldMatch: true, description: 'Text with whitespace' },
  
  // Mismatches
  { actual: '[0,1]', expected: '[1,0]', shouldMatch: false, description: 'Different JSON arrays' },
  { actual: 'hello', expected: 'world', shouldMatch: false, description: 'Different strings' },
  { actual: '42', expected: '43', shouldMatch: false, description: 'Different numbers' },
  
  // Edge cases
  { actual: '', expected: '', shouldMatch: true, description: 'Empty strings' },
  { actual: '0', expected: '0', shouldMatch: true, description: 'Zero as string' },
  { actual: 'true', expected: 'true', shouldMatch: true, description: 'Boolean as string' },
];

// Run tests
let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = compareOutput(test.actual, test.expected);
  const success = result === test.shouldMatch;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.description}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.description}`);
    console.log(`   Expected: ${test.shouldMatch}, Got: ${result}`);
    console.log(`   Actual: "${test.actual}", Expected: "${test.expected}"`);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
