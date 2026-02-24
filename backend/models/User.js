const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
  },
  bio: {
    type: String,
    default: 'Passionate learner exploring the world of AI.',
  },
  location: {
    type: String,
    default: 'Earth',
  },
  role: {
    type: String,
    default: 'Learner',
  },
  experience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resume: {
    text: String,
    fileName: String,
    data: Buffer,
    contentType: String,
    score: Number,
    analysis: Object,
    lastUploadedAt: Date,
    lastAnalyzedAt: Date
  },
  portfolios: [{
    title: String,
    url: String,
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);