# CareerPath — AI-Powered Career Acceleration Platform

> An all-in-one platform combining personalized learning roadmaps, skill assessments, mock interviews, coding practice, resume analysis, and live job search — all driven by Google Gemini AI.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Python](https://img.shields.io/badge/Python-3.12%20FastAPI-3776AB?logo=python&logoColor=white)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [How Content Generation Works](#how-content-generation-works)
- [Contributing](#contributing)
- [Known Limitations](#known-limitations)

---

## Overview

CareerPath eliminates the need to juggle multiple tools. Instead of static pre-written content, everything is generated dynamically — tailored to each user's domain, skill level, and preferred learning style.

**Core idea:** personalized, on-demand learning. Every roadmap, subtopic, quiz, and assessment is generated fresh for each user by AI — and only when they actually need it.

---

## Features

### AI-Generated Learning Roadmaps
Fully personalized, structured learning paths based on your chosen domain (Full Stack, Data Science, DevOps, etc.). Each roadmap is broken into modules and subtopics, all AI-generated and adapted to your skill level.

### Two-Phase Content Generation
- **Phase 1 — Structure:** Opens a module → AI generates subtopic titles, descriptions, and importance levels instantly
- **Phase 2 — Deep Content:** Opens a subtopic → AI generates detailed content on-demand, only when needed

This prevents token overflow, eliminates JSON parsing errors, and avoids unnecessary API calls. Content is cached after first generation.

### Importance-Aware Content Depth
- **High importance** → 800–1500 words with deep explanations and code examples
- **Medium importance** → 500–800 words with solid coverage
- **Low importance** → 300–500 words with a concise overview

### AI Skill Assessments
Intelligent assessments that identify knowledge gaps and personalize your roadmap. Supports custom topics and multiple difficulty levels (Beginner → Expert).

### AI Mock Interviews
Realistic interview simulation with voice support, AI-driven follow-up questions, and performance analysis.

### Code Arena
Full code execution environment with:
- AI-generated DSA problems across 13+ topics
- 10+ language support via Judge0
- Timed sessions with performance analysis
- Built-in online compiler / playground

### Resume Analyzer
AI-powered resume evaluation from a technical recruiter's perspective — highlights strengths, identifies gaps, and suggests improvements.

### Live Job Board
- Real-time job scraping from Indeed, LinkedIn, ZipRecruiter, and Google Jobs
- Role-based job alerts with on-demand refresh
- Filter by location, time range, and source

### AI Learning Chatbot
Context-aware chatbot embedded in every roadmap and module page — ask questions about exactly what you're currently studying.

### Full Authentication
Email/password with verification, forgot/reset password, Google OAuth, JWT sessions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Router |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| AI | Google Gemini 2.5 Flash (primary), OpenAI (fallback + voice) |
| Code Execution | Judge0 CE API |
| Job Scraping | Python 3.12, FastAPI, JobSpy |
| Auth | JWT, Passport.js, Google OAuth 2.0 |
| Email | Nodemailer |

---

## Getting Started

### Prerequisites

| Tool | Version | Required for |
|---|---|---|
| Node.js | >= 18 | Backend + Frontend |
| MongoDB | >= 6 | Database |
| Python | **3.12** (not 3.13) | Job scraping service |
| Git | any | Cloning |

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-learning-platform.git
cd ai-learning-platform
```

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)
npm run dev
```

Backend runs on `http://localhost:5001`

### 3. Set up the Frontend

```bash
cd frontend
npm install
# Create frontend/.env
echo "VITE_API_URL=http://localhost:5001/api" > .env
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Set up the Job Scraping Service (Optional)

> Required only for the Jobs page. Must use Python 3.12.

```bash
cd job-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

Job service runs on `http://localhost:8001`

Add to your backend `.env`:

```env
JOB_SERVICE_URL=http://localhost:8001
```

---

## Project Structure

```
ai-learning-platform/
|
+-- backend/                    # Node.js / Express API
|   +-- config/                 # DB and Passport config
|   +-- controllers/            # Route handlers
|   +-- middleware/             # Auth middleware
|   +-- models/                 # Mongoose schemas
|   +-- routes/                 # Express routers
|   +-- services/               # AI, email, Judge0 services
|   +-- utils/                  # Helpers (JSON validator, language map)
|   +-- server.js               # Entry point
|
+-- frontend/                   # React / Vite app
|   +-- src/
|       +-- api/                # Axios config
|       +-- components/         # Shared UI components
|       +-- context/            # Auth + Theme context
|       +-- hooks/              # Custom hooks
|       +-- pages/              # Route-level page components
|
+-- job-service/                # Python FastAPI microservice
    +-- main.py                 # FastAPI app + scraping logic
    +-- requirements.txt        # Python dependencies
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
MONGO_URI=mongodb://localhost:27017/ai-learning-platform

# Auth
JWT_SECRET=your_jwt_secret_here

# AI
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here        # optional, for voice features

# Code Execution (Judge0)
JUDGE0_API_KEY=                                 # leave empty for free public endpoint
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# Job Service
JOB_SERVICE_URL=http://localhost:8001           # optional, for Jobs page

# Server
PORT=5001
NODE_ENV=development
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5001/api
```

### Getting API Keys

| Service | Where to get it | Free tier |
|---|---|---|
| Google Gemini | https://ai.google.dev | Yes |
| OpenAI | https://platform.openai.com | Limited |
| Judge0 | https://rapidapi.com/judge0-official/api/judge0-ce | Yes |
| MongoDB Atlas | https://mongodb.com/atlas | Yes (512 MB) |

---

## How Content Generation Works

```
User opens Roadmap
      |
      v
Phase 1: AI generates module structure (titles, objectives, topics)
      |
      v
User opens a Module
      |
      v
Phase 1: AI generates subtopic metadata (titles, descriptions, importance levels)
      |
      v
User opens a Subtopic
      |
      v
Phase 2: AI generates full learning content (explanation + code examples)
      |
      v
Content cached in MongoDB -- instant on revisit
      |
      v
User takes subtopic quiz --> marks as reviewed --> unlocks next subtopic
      |
      v
All subtopics reviewed --> Module quiz --> Pass --> Next module unlocked
```

---

## Key Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | Progress overview, quick actions, resume optimizer |
| Roadmap List | `/roadmap` | All learning roadmaps |
| Roadmap Detail | `/roadmap/:id` | Module overview, progress, customize |
| Module Detail | `/roadmap/:id/module/:id` | Subtopic viewer with AI content + chatbot |
| Assessment | `/assessment` | Domain-based skill assessment |
| Code Arena | `/coding` | AI challenges + online compiler |
| Jobs | `/jobs` | Live job search + role alerts |
| Interview | `/interview-landing` | AI mock interview |
| Profile | `/profile` | Account settings, activity, achievements |

---

## Contributing

Contributions are welcome. Here is how to get started:

```bash
# Fork the repo, then:
git clone https://github.com/your-username/ai-learning-platform.git
git checkout -b feature/your-feature-name

# Make your changes, then:
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
# Open a Pull Request
```

**Commit convention:** `feat:` / `fix:` / `docs:` / `style:` / `refactor:` / `chore:`

---

## Known Limitations

- Job scraping requires the Python 3.12 microservice running separately
- Some job sites block scraping — use Indeed, LinkedIn, ZipRecruiter for best results
- Gemini API has rate limits on the free tier — content generation may be slow under heavy use
- Voice features require an OpenAI API key

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with React, Node.js, and Google Gemini AI
