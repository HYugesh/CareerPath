const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Check if OAuth is configured
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const isGitHubConfigured = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

// Google OAuth routes - only if configured
if (isGoogleConfigured) {
  router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
    (req, res) => {
      // Generate JWT token
      const token = signToken(req.user._id);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/oauth/success?token=${token}`);
    }
  );
} else {
  // Fallback routes when Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_not_configured`);
  });
  
  router.get('/google/callback', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_not_configured`);
  });
}

// GitHub OAuth routes - only if configured
if (isGitHubConfigured) {
  router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
    (req, res) => {
      // Generate JWT token
      const token = signToken(req.user._id);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/oauth/success?token=${token}`);
    }
  );
} else {
  // Fallback routes when GitHub OAuth is not configured
  router.get('/github', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=github_not_configured`);
  });
  
  router.get('/github/callback', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=github_not_configured`);
  });
}

module.exports = router;