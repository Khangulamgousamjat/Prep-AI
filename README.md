<div align="center">

<img src="https://img.shields.io/badge/PrepAI-Interview%20Prep-00ff88?style=for-the-badge&logo=google&logoColor=black" alt="PrepAI"/>

# 🤖 PrepAI — AI-Powered Interview Preparation Platform

**Ace every interview with personalized AI-generated questions, real-time scoring, and adaptive feedback.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Now-00ff88?style=flat-square&logo=googlechrome&logoColor=black)](https://github.com/Khangulamgousamjat/Prep-AI)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-6366f1?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🎯 **Smart Question Generation** | AI dynamically creates role-specific MCQ and technical questions for 60+ skill tracks |
| ⚡ **Instant AI Scoring** | Every answer evaluated in real-time with scores from 1–10, strengths, and improvements |
| 🤖 **AI Interview Coach** | Live chat assistant during sessions — ask for hints, examples, or concept explanations |
| 📊 **Progress Analytics** | Score trend graphs, weekly heatmaps, skill breakdown tables, and leaderboards |
| 🧠 **Adaptive Difficulty** | Easy (MCQ), Medium (MCQ), Hard (Technical) — auto-selects the right question format |
| 📜 **Session History** | Review every past session with full Q&A accordion, model answers, and verdict |
| 🔒 **Secure Auth** | Firebase Authentication — register, login, password reset, profile management |
| 🌐 **Offline Resilience** | High-fidelity mock question database activates automatically if API is unavailable |

---

## 🖼️ Screenshots

> **Landing Page** · **Interview Session (MCQ)** · **Results & Analytics**

```
┌─────────────────────────────────────────────┐
│  PrepAI  Features  How It Works  Skill Tracks│   ← Fixed glassmorphic navbar
│                                              │
│    Ace Every Interview With                  │
│    AI-Powered Practice                       │   ← Animated particle hero
│                                              │
│  [Start Practicing Free →] [Watch How It]   │
└─────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
prep-ai/
├── index.html          # Main entrypoint — all HTML views & inline JS
├── style.css           # Complete design system (glassmorphism, animations)
├── .env.example        # Environment variable template (copy → .env)
├── .gitignore          # Excludes .env and temp files
└── README.md           # You are here
```

> **Architecture:** Single-page application (SPA) with 11 views managed by a client-side router (`showView()`). All state is held in memory; sessions are persisted to Firestore or `localStorage` (offline fallback).

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Khangulamgousamjat/Prep-AI.git
cd Prep-AI
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in your credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 3. Serve locally
```bash
# Python (built-in)
python -m http.server 8000

# Node.js
npx serve .

# VS Code
# Install "Live Server" extension → Right-click index.html → Open with Live Server
```

### 4. Open in browser
```
http://localhost:8000
```

---

## 🔑 API Keys Setup

### Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key into `.env` as `GEMINI_API_KEY`

> The app uses `gemini-1.5-flash-8b` (fastest) → `gemini-1.5-flash` → `gemini-1.5-flash-latest` with automatic fallback.

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → Enable **Authentication** (Email/Password)
3. Enable **Firestore Database** → Start in test mode
4. Go to Project Settings → Add a **Web App** → Copy the config object
5. Add the values to your `.env` file

#### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 🧩 Supported Skill Tracks (60+)

| Category | Skills |
|----------|--------|
| **Programming** | Python, JavaScript, TypeScript, Java, C++, Go, Rust, PHP, Swift, Kotlin |
| **Frontend** | React, Vue.js, Angular, Next.js, HTML/CSS, Tailwind CSS |
| **Backend** | Node.js, Django, FastAPI, Spring Boot, Express.js, Laravel |
| **Data & AI** | Machine Learning, Data Science, SQL, PostgreSQL, MongoDB, Pandas |
| **Cloud & DevOps** | AWS, Google Cloud, Docker, Kubernetes, CI/CD, Linux |
| **System Design** | System Design, Microservices, REST APIs, GraphQL |
| **Leadership** | Project Management, Communication, Leadership, Product Management |
| **+ Custom** | Type any skill not in the list — Gemini generates questions dynamically |

---

## 🎮 How It Works

```
1. Register / Login          →  Firebase Auth creates your profile
        ↓
2. Choose Skill + Difficulty →  Easy/Medium = MCQ | Hard = Open-ended
        ↓
3. AI Generates Questions    →  Gemini 1.5 Flash creates 5–20 questions
        ↓
4. Answer + Get Evaluated    →  Real-time AI scoring (1–10) with feedback
        ↓
5. Chat with AI Coach        →  Ask hints, examples, or explanations live
        ↓
6. View Results & Save       →  Session saved to Firestore + analytics updated
```

---

## 📱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES2022) |
| **AI Engine** | Google Gemini 1.5 Flash 8B API |
| **Auth** | Firebase Authentication (Email/Password) |
| **Database** | Cloud Firestore (NoSQL) |
| **Icons** | Lucide Icons |
| **Fonts** | DM Sans, Space Grotesk, JetBrains Mono (Google Fonts) |
| **Hosting** | Any static server (Python, Node, Netlify, Vercel, GitHub Pages) |

---

## 🌍 Deploy to Production

### Netlify (Recommended — Free)
1. Fork this repo
2. Go to [netlify.com](https://netlify.com) → New site from Git
3. Select your fork → Build command: *(leave empty)* → Publish directory: `.`
4. Add environment variables in **Site Settings → Environment Variables**
5. Deploy!

### GitHub Pages
```bash
# In repo settings → Pages → Source: main branch → / (root)
# Note: .env won't work on GitHub Pages — hardcode keys in config (not recommended for public repos)
```

### Vercel
```bash
npm i -g vercel
vercel --prod
```

---

## ⚠️ Security Notes

> **Never commit your `.env` file.** It is listed in `.gitignore` and excluded from all commits.

- For **public/open-source deployments**, use a backend proxy to secure your Gemini API key
- Firebase security rules are already configured to restrict data access per user
- Firestore offline fallback uses `localStorage` — no data is sent to any third-party server

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add: your feature description"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by Gous**

© 2026 PrepAI Inc. · All rights reserved.

⭐ **If this project helped you, please give it a star!** ⭐

</div>
