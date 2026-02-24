// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE ===');
  console.log('Headers:', req.headers.authorization ? 'Token present' : 'No token');
  
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log('Token extracted, verifying...');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified, user ID:', decoded.id);
      
      req.user = await User.findById(decoded.id).select("-password");

      // If user not found for some reason
      if (!req.user) {
        console.log('User not found in database');
        return res.status(401).json({ message: "Not authorized (user not found)" });
      }

      console.log('User authenticated:', req.user.email);
      return next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  console.log('No authorization header found');
  return res.status(401).json({ message: "Not authorized, no token" });
};

// Export the middleware function directly (so require(...) returns a function)
module.exports = protect;