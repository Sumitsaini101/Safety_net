# 🛡️ SafeJourney — Personal Safety Check-in System with Local NLP AI

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-10b981?style=for-the-badge&logo=render&logoColor=white)](https://safety-net-hybh.onrender.com/)
[![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/SQLite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![VADER Sentiment](https://img.shields.io/badge/AI%2FNLP-vaderSentiment-6366F1?style=for-the-badge)](https://github.com/cjhutto/vaderSentiment)

> **Live Deployment:** 🌐 **[https://safety-net-hybh.onrender.com/](https://safety-net-hybh.onrender.com/)**

---

## 📌 Overview

**SafeJourney** is an intelligent personal safety companion and emergency monitoring web application built for solo commuters, late-night workers, students, and travelers. 

It provides proactive safety monitoring by combining a **fail-safe countdown timer** with **real-time local NLP sentiment distress detection**. If a traveler does not check in before their timer expires, or if they type a note indicating fear or danger, SafeJourney automatically escalates to a high-priority **Emergency SOS Alert**.

---

## 🏆 Hackathon Project Highlights

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              SAFEJOURNEY                                │
├───────────────────────────────────┬─────────────────────────────────────┤
│      PHASE 1: CORE SAFETY NET     │      PHASE 2: AI GUARDIAN (NLP)     │
├───────────────────────────────────┼─────────────────────────────────────┤
│  • Timed Journey Registration     │  • Real-Time Transit Quick Notes    │
│  • Live GPS Map Telemetry (OSM)   │  • Local On-Device Sentiment AI     │
│  • Emergency Quick-Dial Hub (112) │  • Distress Threshold Trigger (≤-0.4)│
│  • Massive Centered Timer Gauge   │  • Dynamic Emergency SOS Shift      │
│  • One-Tap "I am Safe" Check-in   │  • Real-Time Sentiment History Log  │
│  • Auto-Expiry Emergency SOS      │  • Live Fleet Community GPS Map     │
│  • Live Monitor Dashboard & KPIs  │  • Click-to-Pan Incident Telemetry  │
└───────────────────────────────────┴─────────────────────────────────────┘
```

---

## ⚡ Feature Breakdown: Phase 1 vs Phase 2

### ⏱️ Phase 1: Core Safety Check-in System

The core safety system guarantees that travelers are never left unmonitored during their commute:

1. **Journey Registration**:
   - Set a destination and expected travel duration (with one-tap duration chips: 15m, 25m, 45m, 60m).
   - Generates a tracking record in SQLite with a UTC timestamp.
2. **Massive Centered Countdown Timer**:
   - High-visibility circular SVG progress gauge with an active breathing pulse animation to visually confirm the live countdown.
3. **One-Tap "I am Safe" Arrival Check-in**:
   - Tactile, glowing emerald button (`btn-safe-glow`) that marks the journey safely completed and disarms the countdown.
4. **Automated Timeout SOS Escalation**:
   - If the countdown reaches zero without the traveler marking themselves safe, the backend automatically transitions the journey status to `sos`.
5. **Real-Time Emergency Monitor Dashboard**:
   - Aggregated overview with live KPI counters (`🚨 SOS Alerts`, `● In Transit`, `✓ Completed Safely`).
   - Incident cards with relative elapsed time (`timeAgo`), destination search filtering, and 5-second automatic polling.

---

### 🧠 Phase 2: AI Guardian — Local NLP Distress Detection

Phase 2 introduces proactive intelligence using **local Natural Language Processing (NLP)** via `vaderSentiment`:

1. **In-Transit Quick Notes / Logs**:
   - Allows solo commuters to log quick status updates (e.g., *"Boarded bus #42"*, *"Walking through the park"*).
2. **Zero-Latency, Privacy-First Sentiment Analysis**:
   - Analyzes note text instantly on the backend using `vaderSentiment`'s `SentimentIntensityAnalyzer`.
   - **100% Local**: No external third-party API calls, zero API subscription costs, complete privacy, and sub-millisecond execution.
3. **Automated Distress Detection (`compound <= -0.4`)**:
   - If a note expresses distress, threat, or panic (e.g., *"Someone is following me and threatening me"*), the analyzer detects negative polarity compound score (≤ -0.4).
   - Instantly escalates the journey status from `active` to `sos` in the database.
4. **Dramatic SOS Emergency Screen Shift**:
   - The UI immediately shifts into an alarming red alert theme:
     - Pulsing background glow (`ambient-light-sos` / `glass-card-sos`).
     - Animated warning beacon with expanding radar pulse waves.
     - High-visibility banner: **`EMERGENCY ALERT TRIGGERED`**.
     - Transparent diagnostic report showing the exact distress sentiment score and trigger note.
5. **Transit Note History Log**:
   - Chronological log of notes with color-coded sentiment scores (`+0.65` normal vs `-0.82` distress).

---

## 🎨 UI/UX Architecture

- **Cross-Device Responsive Design**: Engineered to adapt seamlessly between **Mobile phones** and **Laptops/Desktops** (`max-w-5xl` adaptive container).
  - **Laptop Layout**: 2-column split view (circular timer gauge on the left, live NLP note feed and safety checklist on the right).
  - **Mobile Layout**: Streamlined, single-column touch-first interface.
- **Light Theme ("Lite Theme") Glassmorphism**:
  - Pearl-white frosted cards (`bg-white/88`, `backdrop-blur-xl`, `border-slate-200/85`).
  - Subtle pastel ambient background mesh (`bg-light-mesh`).
  - High-contrast, crystal-clear typography and vibrant accent tokens.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + Vite | Ultra-fast SPA rendering & client-side state |
| **Routing** | React Router v7 | Seamless navigation between Check-in & Live Monitor |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Custom glassmorphism, responsive grid & animations |
| **Backend Framework** | FastAPI (Python 3.10) | High-performance async REST API & static asset hosting |
| **AI / NLP Engine** | `vaderSentiment` | Rule-based local sentiment & distress detection |
| **Database** | SQLite3 (WAL mode) | Lightweight, zero-config relational storage |
| **Validation** | Pydantic v2 | Strict schema validation for requests and responses |
| **Containerization** | Docker (Multi-stage) | Multi-stage build for single-service container deployment |
| **Hosting Platform** | Render (Free Tier) | Cloud Docker Web Service (`EXPOSE 10000`) |

---

## 📡 API Reference

All API routes are prefixed with `/api`:

| Method | Endpoint | Description | Sample Payload / Params |
|---|---|---|---|
| `POST` | `/api/journey` | Start a new journey | `{"destination": "Home from Metro", "expected_duration_minutes": 25}` |
| `PUT` | `/api/journey/{id}/safe` | Mark journey completed safely | `Path: id (int)` |
| `POST` | `/api/journey/{id}/note` | Submit quick note for NLP AI analysis | `{"note": "Suspicious person following me"}` |
| `GET` | `/api/journeys` | Fetch all journeys with computed statuses | *None* |

### Example NLP Note Analysis Response
```json
{
  "journey_id": 1,
  "status": "sos",
  "sentiment_score": -0.7227,
  "is_distress": true,
  "journey": {
    "id": 1,
    "destination": "Evening commute",
    "start_time": "2026-08-19T06:30:00+00:00",
    "expected_duration_minutes": 20,
    "status": "sos",
    "is_expired": false,
    "remaining_seconds": 980
  }
}
```

---

## 💻 Local Setup & Development

### Prerequisites
- **Node.js** (v18+ or v20+)
- **Python** (v3.10+)
- **Git**

---

### Option 1: Running Full-Stack (Backend + Frontend)

#### 1. Clone the repository
```bash
git clone https://github.com/Sumitsaini101/Safety_net.git
cd Safety_net
```

#### 2. Start the Backend API
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python main.py
```
*Backend runs at `http://localhost:8000` (API docs at `http://localhost:8000/docs`).*

#### 3. Start the Frontend Dev Server
In a new terminal window:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

### Option 2: Running Single Production Service (FastAPI serves React SPA)

```bash
# 1. Build React Frontend
cd frontend
npm install
npm run build
cd ..

# 2. Start FastAPI Server from project root
cd backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
*Open `http://localhost:8000` in your browser.*

---

### Option 3: Running with Docker

```bash
# Build Docker image
docker build -t safenourney-app .

# Run container
docker run -p 10000:10000 safenourney-app
```
*Open `http://localhost:10000` in your browser.*

---

## 📁 Repository Structure

```
Safety_net/
├── backend/
│   ├── database.py         # SQLite connection, WAL mode & table initialization
│   ├── main.py             # FastAPI endpoints, SPA static routing & lifespan
│   ├── models.py           # Pydantic schemas (JourneyCreate, NoteResponse, etc.)
│   ├── requirements.txt    # Python packages (fastapi, uvicorn, vaderSentiment)
│   └── safejourney.db      # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useJourneys.js   # Custom React hook for API state & telemetry
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Start form, massive timer, Safe button & SOS
│   │   │   └── Dashboard.jsx    # Real-time incident monitor, KPIs & search
│   │   ├── App.jsx              # Responsive layout container & navbar
│   │   ├── index.css            # Light theme tokens, animations & glassmorphism
│   │   └── main.jsx             # React DOM root
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── Dockerfile              # Multi-stage container build for Render
├── .dockerignore           # Excludes local caches & node_modules
└── README.md               # Project documentation
```

---

## 🌟 Hackathon Evaluation Summary

1. **Real-World Impact**: Directly tackles solo-commuter vulnerability with an automated guardian check-in.
2. **Deterministic Reliability**: The core safety timer triggers even if network connectivity drops or if the user is incapacitated.
3. **Local AI / Edge Feasibility**: `vaderSentiment` ensures real-time distress detection without reliance on costly or slow cloud LLM APIs.
4. **Refined UX**: Fully responsive across mobile phones and desktop laptops with light theme glassmorphism and dramatic visual emergency states.

---

*Built with ❤️ for safer solo journeys.*
