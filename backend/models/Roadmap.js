const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // From requirements
  primaryDomain: {
    type: String,
    required: true,
    trim: true
  },
  currentSkillLevel: {
    type: String,
    required: true,
    enum: ['Absolute Beginner', 'Beginner', 'Intermediate', 'Advanced']
  },
  timeCommitment: {
    type: Number,
    required: true
  },
  learningGoal: {
    type: String,
    required: true,
    enum: ['Job-ready', 'Project-based', 'Certification', 'Knowledge']
  },
  deadline: {
    type: Date
  },
  knownTopics: [{
    type: String
  }],
  preferredLearningStyle: {
    type: String,
    required: true,
    enum: ['Theory-first', 'Practice-first', 'Balanced']
  },
  // Roadmap specific fields
  title: {
    type: String,
    required: true
  },
  pathTitle: {
    type: String  // AI-generated title (e.g., "Java Mastery Roadmap")
  },
  description: {
    type: String
  },
  duration: {
    type: String // e.g., "7 days", "2 weeks", "1 month"
  },
  totalModules: {
    type: Number,
    default: 0
  },
  estimatedTotalHours: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  modules: [{
    moduleId: Number,
    title: String,
    moduleType: {
      type: String,
      enum: ['concept', 'coding', 'project', 'revision', 'interview']
    },
    objective: String,
    difficultyLevel: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard']
    },
    estimatedHours: Number,
    prerequisites: [Number],
    topics: [String],
    tags: [String],
    isBranching: {
      type: Boolean,
      default: false
    },
    branchingOptions: [String],
    
    // Enhanced structure
    status: {
      type: String,
      enum: ['LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'LOCKED'
    },
    
    // Sub-components (topics within the module)
    subComponents: [{
      subComponentId: Number,
      title: String,
      hasQuiz: {
        type: Boolean,
        default: true // Most topics have quizzes except intro topics
      },
      learningContent: {
        explanation: String,
        codeExamples: [{
          language: String,
          code: String,
          description: String
        }],
        visualDiagrams: [String], // URLs or base64
        keyTakeaways: [String],
        commonMistakes: [String],
        // Hidden summary for quiz generation (not shown to user)
        contentSummary: {
          type: String,
          select: false // This field won't be returned in queries by default
        }
      },
      externalResources: {
        videos: [{
          title: String,
          url: String,
          duration: String,
          platform: String
        }],
        articles: [{
          title: String,
          url: String,
          source: String
        }],
        officialDocs: [{
          title: String,
          url: String,
          section: String
        }],
        interactiveTools: [{
          title: String,
          url: String,
          description: String
        }]
      },
      practiceExercise: {
        question: String,
        hints: [String],
        solution: String
      },
      quizAttempts: [{
        attemptNumber: Number,
        score: Number,
        passed: Boolean,
        completedAt: Date
      }],
      status: {
        type: String,
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'REVIEWED'],
        default: 'NOT_STARTED'
      },
      reviewedAt: Date
    }],
    
    // Knowledge Check (Quiz)
    knowledgeCheck: {
      questions: [{
        questionId: Number,
        type: {
          type: String,
          enum: ['multiple-choice', 'true-false', 'fill-blank', 'short-answer']
        },
        question: String,
        options: [String], // For multiple choice
        correctAnswer: String,
        explanation: String,
        points: {
          type: Number,
          default: 1
        }
      }],
      passingScore: {
        type: Number,
        default: 80
      },
      attemptsAllowed: {
        type: Number,
        default: 3
      },
      attempts: [{
        attemptNumber: Number,
        score: Number,
        answers: [{
          questionId: mongoose.Schema.Types.Mixed, // Can be Number or ObjectId
          questionText: String,
          selectedOption: String,
          correctAnswer: String,
          userAnswer: String,
          isCorrect: Boolean
        }],
        completedAt: Date
      }],
      status: {
        type: String,
        enum: ['NOT_ATTEMPTED', 'IN_PROGRESS', 'PASSED', 'FAILED'],
        default: 'NOT_ATTEMPTED'
      },
      cooldownUntil: Date // 24-hour cooldown after 3 failed attempts
    },
    
    // Coding Challenges
    codingChallenges: {
      problems: [{
        problemId: Number,
        title: String,
        description: String,
        difficulty: {
          type: String,
          enum: ['Easy', 'Medium', 'Hard']
        },
        examples: [{
          input: String,
          output: String,
          explanation: String
        }],
        constraints: [String],
        testCases: [{
          input: String,
          expectedOutput: String,
          isHidden: Boolean,
          points: Number
        }],
        hints: [{
          text: String,
          unlockAfterMinutes: Number
        }],
        solution: {
          code: String,
          explanation: String,
          timeComplexity: String,
          spaceComplexity: String
        },
        starterCode: String,
        userSubmissions: [{
          code: String,
          language: String,
          testsPassed: Number,
          totalTests: Number,
          submittedAt: Date
        }],
        status: {
          type: String,
          enum: ['NOT_ATTEMPTED', 'IN_PROGRESS', 'PASSED'],
          default: 'NOT_ATTEMPTED'
        }
      }],
      passingCriteria: {
        type: Number,
        default: 70 // 70% of test cases
      },
      overallStatus: {
        type: String,
        enum: ['NOT_ATTEMPTED', 'IN_PROGRESS', 'PASSED'],
        default: 'NOT_ATTEMPTED'
      }
    },
    
    // Completion tracking
    completionCriteria: {
      contentReview: {
        required: Boolean,
        completed: Boolean
      },
      quizScore: {
        required: Boolean,
        completed: Boolean
      },
      codingChallenges: {
        required: Boolean,
        completed: Boolean
      }
    },
    
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    
    // Additional customization fields
    markedAsKnown: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['must-learn', 'nice-to-have'],
      default: 'must-learn'
    }
  }],
  
  // Decision Points (Branching)
  decisionPoints: [{
    decisionPointId: Number,
    afterModuleId: Number, // Appears after this module
    title: String,
    description: String,
    paths: [{
      pathId: String,
      title: String,
      description: String,
      careerRelevance: String,
      upcomingModules: [String],
      estimatedTime: String
    }],
    selectedPath: String,
    status: {
      type: String,
      enum: ['LOCKED', 'UNLOCKED', 'SELECTED'],
      default: 'LOCKED'
    }
  }],
  learningPath: {
    foundational: [Number],
    intermediate: [Number],
    advanced: [Number]
  },
  tags: [{
    type: String
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiProvider: {
    type: String,
    enum: ['gemini', 'openai', 'fallback'],
    default: 'gemini'
  },
  generationMetadata: {
    usedFallback: Boolean,
    generatedAt: Date,
    model: String
  }
}, {
  timestamps: true
});

// Add index for efficient querying (non-unique to allow multiple roadmaps per user per domain)
roadmapSchema.index({ userId: 1, primaryDomain: 1 });
roadmapSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);
