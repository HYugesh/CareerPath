/**
 * RoadmapBlueprint Model
 * Stores AI-generated learning path structure for users
 * Contains only the roadmap structure, not learning content
 */

const mongoose = require('mongoose');

// Step schema for individual learning steps
const stepSchema = new mongoose.Schema({
    stepId: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    stepType: {
        type: String,
        required: true,
        enum: ['concept', 'coding', 'revision', 'interview']
    },
    objective: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    difficultyLevel: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard']
    },
    estimatedEffort: {
        type: String,
        required: true,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    }
}, { _id: false });

// Main RoadmapBlueprint schema
const roadmapBlueprintSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    pathTitle: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    steps: {
        type: [stepSchema],
        required: true,
        validate: {
            validator: function (steps) {
                // Must have between 6-12 steps
                if (steps.length < 6 || steps.length > 12) {
                    return false;
                }
                // Last step must be of type 'interview'
                if (steps[steps.length - 1].stepType !== 'interview') {
                    return false;
                }
                return true;
            },
            message: 'Steps must be between 6-12 and final step must be of type "interview"'
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'DRAFT'
    },
    totalEstimatedHours: {
        type: Number,
        default: 0
    },
    completedSteps: {
        type: Number,
        default: 0
    },
    lastGeneratedAt: {
        type: Date,
        default: Date.now
    },
    generationCount: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Index for faster queries
roadmapBlueprintSchema.index({ userId: 1 });
roadmapBlueprintSchema.index({ status: 1 });

// Virtual for progress percentage
roadmapBlueprintSchema.virtual('progressPercentage').get(function () {
    if (!this.steps || this.steps.length === 0) return 0;
    return Math.round((this.completedSteps / this.steps.length) * 100);
});

// Method to mark a step as completed
roadmapBlueprintSchema.methods.completeStep = function (stepId) {
    const step = this.steps.find(s => s.stepId === stepId);
    if (step && !step.isCompleted) {
        step.isCompleted = true;
        step.completedAt = new Date();
        this.completedSteps += 1;

        // Update status if all steps are completed
        if (this.completedSteps === this.steps.length) {
            this.status = 'COMPLETED';
        } else if (this.status === 'DRAFT' || this.status === 'APPROVED') {
            this.status = 'IN_PROGRESS';
        }
    }
    return this;
};

// Ensure virtuals are included in JSON
roadmapBlueprintSchema.set('toJSON', { virtuals: true });
roadmapBlueprintSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RoadmapBlueprint', roadmapBlueprintSchema);
