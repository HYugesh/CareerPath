# GeminiCodeArena - AI-Powered Coding Platform

## Overview
GeminiCodeArena is an AI-powered coding interview platform that generates dynamic programming problems and provides intelligent code analysis using Google's Gemini AI.

## Features

### 🎯 Setup Phase
- **Topic Selection**: Choose from 9 DSA topics (Arrays & Hashing, Two Pointers, Sliding Window, etc.)
- **Language Support**: JavaScript, Python, Java, C++
- **Difficulty Levels**: Easy, Medium, Hard
- **Time Limits**: 15, 30, 45, 60 minutes or unlimited
- **Problem Count**: 1-5 problems per session

### 💻 Coding Phase
- **Split-Panel Interface**: Problem description on left, code editor on right
- **Real-time Timer**: Visual countdown with color-coded warnings
- **Test Execution**: Run code against public test cases
- **AI Analysis**: Submit for comprehensive code analysis

### 🧠 AI-Powered Features
- **Dynamic Problem Generation**: Unique problems generated based on your preferences
- **Code Execution Simulation**: AI mentally executes your code against test cases
- **Complexity Analysis**: Time and space complexity evaluation
- **Optimization Suggestions**: Detailed feedback on code improvements
- **Rating System**: 1-10 code quality scoring

### 🎨 UI/UX Features
- **Dark Theme**: Professional coding environment
- **Animated Backgrounds**: Subtle floating elements
- **Glass Morphism**: Modern card designs with backdrop blur
- **Responsive Design**: Works on desktop and tablet
- **Smooth Animations**: Fade-in, slide-in, and zoom effects

## Technical Implementation

### Dependencies
```json
{
  "@google/genai": "^1.32.0",
  "lucide-react": "^0.556.0",
  "react": "^19.2.1"
}
```

### Environment Variables
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Key Components
- **Setup View**: Configuration interface for problem generation
- **Coding View**: Split-panel coding environment
- **Analysis Modal**: AI feedback and code analysis
- **Timer System**: Real-time countdown functionality

### API Integration
- Uses Google Gemini AI for problem generation
- Structured JSON responses with schema validation
- Error handling and fallback mechanisms
- Rate limiting and quota management

## Usage

1. **Access**: Navigate to `/coding` route
2. **Configure**: Select topic, difficulty, language, and preferences
3. **Generate**: Click "Begin Challenge" to generate problems
4. **Code**: Write solutions in the provided editor
5. **Test**: Use "Test Code" for public test cases
6. **Submit**: Use "Submit & Analyze" for full evaluation

## File Structure
```
frontend/src/pages/GeminiCodeArena.tsx  # Main component
frontend/src/styles/animations.css      # Custom animations
frontend/.env                          # Environment variables
```

## Styling
- **Framework**: Tailwind CSS
- **Color Scheme**: Dark theme with blue/cyan accents
- **Typography**: Monospace for code, sans-serif for UI
- **Animations**: Custom CSS keyframes + Tailwind utilities

## Future Enhancements
- Session persistence and history
- Multiple test case types
- Code sharing and collaboration
- Performance metrics tracking
- Advanced AI hints and debugging