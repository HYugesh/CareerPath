/**
 * Test script for code execution
 * Run: node test-code-execution.js
 */

const { spawn } = require('child_process');

console.log('🧪 Testing Code Execution Setup\n');

// Test 1: Check Node.js
console.log('1️⃣ Testing Node.js...');
try {
  const nodeVersion = spawn('node', ['--version']);
  nodeVersion.stdout.on('data', (data) => {
    console.log(`   ✅ Node.js installed: ${data.toString().trim()}`);
  });
  nodeVersion.on('error', () => {
    console.log('   ❌ Node.js not found. Install from https://nodejs.org');
  });
} catch (error) {
  console.log('   ❌ Node.js not found. Install from https://nodejs.org');
}

// Test 2: Check Python
setTimeout(() => {
  console.log('\n2️⃣ Testing Python...');
  try {
    const pythonVersion = spawn('python3', ['--version']);
    pythonVersion.stdout.on('data', (data) => {
      console.log(`   ✅ Python 3 installed: ${data.toString().trim()}`);
    });
    pythonVersion.stderr.on('data', (data) => {
      console.log(`   ✅ Python 3 installed: ${data.toString().trim()}`);
    });
    pythonVersion.on('error', () => {
      console.log('   ❌ Python 3 not found. Install from https://python.org');
    });
  } catch (error) {
    console.log('   ❌ Python 3 not found. Install from https://python.org');
  }
}, 500);

// Test 3: Check Judge0 API configuration
setTimeout(() => {
  console.log('\n3️⃣ Checking Judge0 API configuration...');
  require('dotenv').config();
  
  if (process.env.JUDGE0_API_KEY) {
    console.log('   ✅ Judge0 API key configured');
  } else {
    console.log('   ⚠️  Judge0 API key not configured (Java/C++/C will use free tier with limits)');
    console.log('   💡 Get a free key from: https://rapidapi.com/judge0-official/api/judge0-ce');
  }
}, 1000);

// Test 4: Test JavaScript execution
setTimeout(() => {
  console.log('\n4️⃣ Testing JavaScript execution...');
  const testCode = `
    const readline = require('readline');
    const rl = readline.createInterface({input: process.stdin});
    let input = [];
    rl.on('line', (line) => { input.push(line); });
    rl.on('close', () => {
      const data = JSON.parse(input[0]);
      console.log(JSON.stringify([0,1]));
    });
  `;
  
  const node = spawn('node', ['-e', testCode]);
  node.stdin.write('{"nums":[2,7],"target":9}\n');
  node.stdin.end();
  
  let output = '';
  node.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  node.on('close', (code) => {
    if (code === 0 && output.trim() === '[0,1]') {
      console.log('   ✅ JavaScript execution working!');
    } else {
      console.log('   ❌ JavaScript execution failed');
      console.log('   Output:', output);
    }
  });
  
  node.on('error', (error) => {
    console.log('   ❌ JavaScript execution failed:', error.message);
  });
}, 1500);

// Test 5: Test Python execution
setTimeout(() => {
  console.log('\n5️⃣ Testing Python execution...');
  const testCode = `import json, sys; data = json.loads(sys.stdin.read()); print(json.dumps([0,1]))`;
  
  const python = spawn('python3', ['-c', testCode]);
  python.stdin.write('{"nums":[2,7],"target":9}');
  python.stdin.end();
  
  let output = '';
  python.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  python.on('close', (code) => {
    if (code === 0 && output.trim() === '[0,1]') {
      console.log('   ✅ Python execution working!');
    } else {
      console.log('   ❌ Python execution failed');
      console.log('   Output:', output);
    }
  });
  
  python.on('error', (error) => {
    console.log('   ❌ Python execution failed:', error.message);
  });
}, 2000);

// Summary
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  console.log('✅ = Working');
  console.log('⚠️  = Optional (for Java/C++/C support)');
  console.log('❌ = Needs installation');
  console.log('\n💡 Tip: JavaScript and Python work locally without any API!');
  console.log('💡 Tip: Java/C++/C require Judge0 API (free tier available)');
  console.log('\n📖 See SETUP_CODE_EXECUTION.md for detailed setup instructions');
}, 2500);
