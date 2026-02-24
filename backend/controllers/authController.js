const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../services/emailService");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log("Registration attempt:", { name, email, passwordLength: password?.length });

    // 1. Strict Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Email format validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one uppercase letter and one number" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isVerified: false, // User must verify email first
      verificationToken: verificationCode,
      verificationTokenExpire: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    await user.save();

    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: "Verify Your Email - CareerPath AI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e1e5e9; border-radius: 10px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">Welcome to CareerPath AI! 🚀</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Your intelligent learning partner</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 15px 0;">Verify Your Email Address</h2>
              <p style="color: #e5e7eb; margin: 0;">Please use the verification code below to complete your registration:</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #f8fafc; border: 2px dashed #3b82f6; padding: 20px; border-radius: 10px; display: inline-block;">
                <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Your Verification Code:</p>
                <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${verificationCode}
                </div>
              </div>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⏰ Important:</strong> This code will expire in 15 minutes. Please verify your email promptly.
              </p>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
              <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Enter the verification code on the registration page</li>
                <li style="margin-bottom: 8px;">Complete your profile setup</li>
                <li style="margin-bottom: 8px;">Start your AI-powered learning journey</li>
                <li>Access personalized roadmaps and assessments</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                If you didn't create an account with CareerPath AI, please ignore this email.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 CareerPath AI - Your Intelligent Learning Partner<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        `
      });

      console.log(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Delete the user if email fails to send
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        message: "Failed to send verification email. Please try again later."
      });
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email for verification code.",
      email: user.email,
      requiresVerification: true
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    console.log("Login attempt:", { identifier, passwordLength: password?.length });

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email or name
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { name: identifier.trim() }
      ],
    });

    console.log("User found:", user ? { id: user._id, name: user.name, email: user.email } : "No user found");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    console.log("Password match:", match);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email before logging in. Check your inbox for the verification code.",
        requiresVerification: true,
        email: user.email
      });
    }

    // Generate and send token
    const token = signToken(user._id);

    console.log("Login successful for user:", user.email);

    // Return user data with token
    console.log("Login success, returning token and user data");
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        role: user.role,
        experience: user.experience
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    if (req.user) {
      res.json({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        bio: req.user.bio,
        location: req.user.location,
        role: req.user.role,
        experience: req.user.experience
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

const socialLogin = async (req, res, next) => {
  try {
    const { name, email, googleId, githubId, image } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required for social login" });
    }

    // Try finding by social ID first
    let user = null;
    if (googleId) {
      user = await User.findOne({ googleId });
    } else if (githubId) {
      user = await User.findOne({ githubId });
    }

    // If not found by social ID, try by email
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase().trim() });

      if (user) {
        // Link social ID to existing account
        if (googleId) user.googleId = googleId;
        if (githubId) user.githubId = githubId;
        await user.save();
      } else {
        // Create new user (social login doesn't need a password initially, but we'll set a random one)
        const salt = await bcrypt.genSalt(10);
        const randomPassword = await bcrypt.hash(Math.random().toString(36), salt);

        user = new User({
          name: name || email.split('@')[0],
          email: email.toLowerCase().trim(),
          password: randomPassword,
          googleId,
          githubId
        });
        await user.save();
      }
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        role: user.role,
        experience: user.experience
      }
    });
  } catch (err) {
    console.error("Social login error:", err);
    res.status(500).json({ message: "Server error during social login" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      verificationToken: otp,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    console.log(`User ${email} verified successfully`);
    return res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Server error during verification" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // Generate 6-digit OTP for reset
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = resetOtp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Password Reset Code - CareerPath AI",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #3b82f6;">Password Reset</h2>
          <p>You requested a password reset. Please use the following code to reset your password:</p>
          <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a; border-radius: 5px;">
            ${resetOtp}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">CareerPath AI - Your Intelligent Learning Partner</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: "Reset code sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error during password reset request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, code, and new password are required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Password must contain at least one uppercase letter and one number" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful! You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "New password must contain at least one uppercase letter and one number" });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully!" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error during password change" });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isVerified: false
    });

    if (!user) {
      return res.status(404).json({ message: "User not found or already verified" });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationToken = verificationCode;
    user.verificationTokenExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send verification email
    await sendEmail({
      email: user.email,
      subject: "New Verification Code - CareerPath AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e1e5e9; border-radius: 10px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">New Verification Code 🔄</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">CareerPath AI</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: white; margin: 0 0 15px 0;">Here's Your New Code</h2>
            <p style="color: #e5e7eb; margin: 0;">Use this verification code to complete your registration:</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #f8fafc; border: 2px dashed #3b82f6; padding: 20px; border-radius: 10px; display: inline-block;">
              <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Your New Verification Code:</p>
              <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </div>
            </div>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏰ Important:</strong> This code will expire in 15 minutes.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 CareerPath AI - Your Intelligent Learning Partner<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: "New verification code sent to your email"
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error while resending verification code" });
  }
};

module.exports = {
  register,
  login,
  getUserProfile,
  socialLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerificationCode,
  changePassword
};

