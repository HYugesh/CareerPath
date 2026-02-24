const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Domain = require("./models/Domain");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

// Questions are now part of QuizSession, no separate Question model needed

dotenv.config();

// Domains with steps - Updated to match assessment requirements
const domains = [
  { 
    name: "Web Development", 
    description: "Full-stack web development with modern technologies",
    steps: [
      'HTML & CSS Fundamentals',
      'JavaScript ES6+ Features',
      'Frontend Frameworks (React, Vue, Angular)',
      'Backend Development (Node.js, Express)',
      'Database Management (SQL, NoSQL)',
      'API Development & Integration',
      'Version Control with Git',
      'Deployment & DevOps'
    ]
  },
  { 
    name: "Data Science", 
    description: "Master data analysis, visualization, and machine learning",
    steps: [
      'Python Programming Fundamentals',
      'NumPy for Numerical Computing',
      'Pandas for Data Manipulation',
      'Data Visualization (Matplotlib, Seaborn)',
      'Statistical Analysis & Probability',
      'Machine Learning Algorithms',
      'Deep Learning Basics',
      'Data Science Projects'
    ]
  },
  { 
    name: "Machine Learning", 
    description: "Advanced machine learning and AI algorithms",
    steps: [
      'ML Fundamentals & Mathematics',
      'Supervised Learning Algorithms',
      'Unsupervised Learning Techniques',
      'Deep Learning & Neural Networks',
      'Natural Language Processing',
      'Computer Vision',
      'Model Deployment & MLOps',
      'Advanced ML Projects'
    ]
  },
  { 
    name: "Artificial Intelligence", 
    description: "Comprehensive AI development and applications",
    steps: [
      'AI Fundamentals & History',
      'Search Algorithms & Problem Solving',
      'Knowledge Representation',
      'Machine Learning Integration',
      'Natural Language Processing',
      'Computer Vision & Image Processing',
      'Robotics & Automation',
      'AI Ethics & Future Trends'
    ]
  },
  { 
    name: "Cloud Computing", 
    description: "Master cloud platforms and distributed systems",
    steps: [
      'Cloud Computing Fundamentals',
      'AWS/Azure/GCP Core Services',
      'Infrastructure as Code',
      'Containerization (Docker, Kubernetes)',
      'Serverless Computing',
      'Cloud Security & Compliance',
      'Monitoring & Cost Optimization',
      'Cloud Architecture Design'
    ]
  },
  { 
    name: "Cybersecurity", 
    description: "Information security and ethical hacking",
    steps: [
      'Security Fundamentals',
      'Network Security Protocols',
      'Web Application Security',
      'Cryptography & Encryption',
      'Penetration Testing',
      'Incident Response',
      'Security Compliance',
      'Ethical Hacking Techniques'
    ]
  },
  { 
    name: "Mobile Development", 
    description: "iOS and Android app development",
    steps: [
      'Mobile Development Fundamentals',
      'Native Development (iOS/Android)',
      'Cross-Platform Frameworks',
      'UI/UX Design for Mobile',
      'Mobile Backend Services',
      'App Store Deployment',
      'Mobile Security',
      'Performance Optimization'
    ]
  },
  { 
    name: "DevOps", 
    description: "Development operations and automation",
    steps: [
      'DevOps Culture & Principles',
      'Version Control & Git Workflows',
      'CI/CD Pipeline Development',
      'Infrastructure Automation',
      'Containerization & Orchestration',
      'Monitoring & Logging',
      'Security in DevOps',
      'Cloud Infrastructure Management'
    ]
  },
  { 
    name: "Blockchain", 
    description: "Blockchain technology and cryptocurrency development",
    steps: [
      'Blockchain Fundamentals',
      'Cryptocurrency Basics',
      'Smart Contract Development',
      'Ethereum & Solidity',
      'DeFi Applications',
      'NFT Development',
      'Blockchain Security',
      'Web3 Integration'
    ]
  },
  { 
    name: "Game Development", 
    description: "Video game design and development",
    steps: [
      'Game Design Principles',
      'Programming Languages for Games',
      'Game Engines (Unity, Unreal)',
      '2D & 3D Graphics',
      'Physics & Animation',
      'Game AI & Algorithms',
      'Multiplayer Development',
      'Game Publishing & Marketing'
    ]
  }
];

// Sample assessment questions
const sampleQuestions = [
  {
    domain: "Java Full Stack",
    question: "Which keyword is used to inherit a class in Java?",
    options: ["super", "this", "extends", "implements"],
    correctAnswer: 2,
    difficulty: "easy",
  },
  {
    domain: "Java Full Stack",
    question: "Which framework is most commonly used for building REST APIs in Java?",
    options: ["Spring Boot", "React", "Hibernate", "Struts"],
    correctAnswer: 0,
    difficulty: "medium",
  },
  {
    domain: "Data Science",
    question: "Which Python library is best for data manipulation?",
    options: ["TensorFlow", "Pandas", "Matplotlib", "Seaborn"],
    correctAnswer: 1,
    difficulty: "easy",
  },
  {
    domain: "Data Science",
    question: "Which algorithm is used for classification?",
    options: ["Linear Regression", "Logistic Regression", "K-Means", "PCA"],
    correctAnswer: 1,
    difficulty: "medium",
  },
  {
    domain: "Frontend Development",
    question: "Which hook is used for managing state in React?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    correctAnswer: 0,
    difficulty: "easy",
  },
];

(async function seed() {
  try {
    await connectDB();

    // 1. Wipe and insert the Domain templates
    await Domain.deleteMany({});
    const insertedDomains = await Domain.insertMany(domains);
    console.log(`✅ Inserted ${insertedDomains.length} domains.`);

    // 2. Questions are now generated dynamically by AI, no need to seed them
    console.log(`✅ Questions will be generated dynamically by AI.`);

    // 3. Optional: Create an admin user
    const adminEmail = "admin@test.com";
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash("admin123", salt);
      const admin = new User({
        name: "admin",
        email: adminEmail,
        password: hashed,
      });
      await admin.save();
      console.log("✅ Created admin user: admin@test.com / admin123");
    }

    console.log("🎉 Database seeding complete!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
})();