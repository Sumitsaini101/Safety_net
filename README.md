# 🛡️ SafeJourney — Personal Safety Check-in System

A full-stack, mobile-first web application that serves as a smart check-in system for solo commuters and late-night workers.

## ✨ Features

- **Start a Journey** — Enter your destination and expected duration
- **Live Countdown Timer** — Animated ring timer tracks your journey in real time
- **"I am Safe" Check-in** — Giant green button to confirm you arrived safely
- **Emergency Dashboard** — Real-time feed of all journeys with flashing SOS alerts
- **Automatic SOS** — If the timer expires without a check-in, the system triggers an SOS alert

## 🏗️ Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | React + Vite + Tailwind CSS v4 |
| Backend  | FastAPI (Python)    |
| Database | SQLite              |

## 🚀 Getting Started

### Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

The API server starts at **http://localhost:8000**.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**.

## 📡 API Endpoints

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| POST   | `/api/journey`             | Create a new journey                 |
| PUT    | `/api/journey/{id}/safe`   | Mark a journey as safely completed   |
| GET    | `/api/journeys`            | List all journeys with live statuses |

## 📂 Project Structure

```
Safety_net/
├── backend/
│   ├── main.py              # FastAPI app & endpoints
│   ├── database.py          # SQLite setup & helpers
│   ├── models.py            # Pydantic request/response models
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx     # Journey creation + countdown
│   │   │   └── Dashboard.jsx # Emergency monitoring feed
│   │   ├── hooks/
│   │   │   └── useJourneys.js # API hook
│   │   ├── App.jsx          # Root layout + routing
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Full design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```
