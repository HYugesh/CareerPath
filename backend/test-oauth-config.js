// Test script to verify OAuth configuration
require('dotenv').config();

console.log('=== OAuth Configuration Test ===\n');

// Check Google OAuth
console.log('Google OAuth:');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set');
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set');

// Check GitHub OAuth
console.log('\nGitHub OAuth:');
console.log('  GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Not set');
console.log('  GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '✅ Set' : '❌ Not set');

// Check other required variables
console.log('\nOther Configuration:');
console.log('  SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Not set');
console.log('  CLIENT_URL:', process.env.CLIENT_URL ? '✅ Set' : '❌ Not set');

console.log('\n=== Configuration Status ===');
const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const githubConfigured = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

if (googleConfigured && githubConfigured) {
  console.log('🎉 Both Google and GitHub OAuth are configured!');
} else if (googleConfigured) {
  console.log('✅ Google OAuth is configured');
  console.log('⚠️  GitHub OAuth is not configured');
} else if (githubConfigured) {
  console.log('✅ GitHub OAuth is configured');
  console.log('⚠️  Google OAuth is not configured');
} else {
  console.log('❌ Neither Google nor GitHub OAuth are configured');
  console.log('📝 Follow the setup guide to add OAuth credentials');
}

console.log('\n=== Next Steps ===');
if (!googleConfigured || !githubConfigured) {
  console.log('1. Get OAuth credentials from providers');
  console.log('2. Update backend/.env file with real credentials');
  console.log('3. Restart the server');
  console.log('4. Test OAuth buttons in the app');
} else {
  console.log('✅ OAuth is ready! Test the buttons in your app.');
}