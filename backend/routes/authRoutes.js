const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  register,
  login,
  getUserProfile,
  socialLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerificationCode,
  changePassword,
} = require("../controllers/authController");

// @route   POST /api/auth/register
// @desc    Register user
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Login user
router.post("/login", login);

// @route   POST /api/auth/social-login
// @desc    Social login (Google/GitHub)
router.post("/social-login", socialLogin);

// @route   GET /api/auth/profile
// @desc    Get user profile for persistent login
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   POST /api/auth/verify-otp
// @desc    Verify user email with OTP
router.post("/verify-otp", verifyEmail);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP
router.post("/forgot-password", forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
router.post("/reset-password", resetPassword);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification code
router.post("/resend-verification", resendVerificationCode);

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
router.post("/change-password", protect, changePassword);

module.exports = router;
