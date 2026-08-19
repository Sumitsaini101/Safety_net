import os
import sys

# Ensure backend directory is in sys.path when running from project root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from database import get_db, init_db
from models import JourneyCreate, JourneyResponse, NoteCreate, NoteResponse
# pyrefly: ignore [missing-import]
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

sia = SentimentIntensityAnalyzer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="SafeJourney API",
    description="Personal Safety Check-in System for solo commuters and late-night workers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _compute_journey_fields(row: dict) -> JourneyResponse:
    """Compute derived fields (is_expired, remaining_seconds) for a journey row."""
    start_time_str = str(row["start_time"]).replace("Z", "+00:00")
    try:
        start_time = datetime.fromisoformat(start_time_str)
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
    except Exception:
        start_time = datetime.now(timezone.utc)

    now = datetime.now(timezone.utc)
    elapsed_seconds = (now - start_time).total_seconds()
    total_seconds = row["expected_duration_minutes"] * 60
    remaining = int(total_seconds - elapsed_seconds)

    status = row["status"]
    is_expired = False

    if status == "active" and remaining <= 0:
        is_expired = True
        # Auto-update status to SOS in the database
        conn = get_db()
        conn.execute("UPDATE journeys SET status = 'sos' WHERE id = ?", (row["id"],))
        conn.commit()
        conn.close()
        status = "sos"

    return JourneyResponse(
        id=row["id"],
        destination=row["destination"],
        start_time=row["start_time"],
        expected_duration_minutes=row["expected_duration_minutes"],
        status=status,
        is_expired=is_expired,
        remaining_seconds=max(remaining, 0) if status == "active" else 0,
    )


@app.post("/api/journey", response_model=JourneyResponse, status_code=201)
def create_journey(journey: JourneyCreate):
    """Create a new journey with a destination and expected duration."""
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    cursor = conn.execute(
        "INSERT INTO journeys (destination, start_time, expected_duration_minutes, status) VALUES (?, ?, ?, ?)",
        (journey.destination, now, journey.expected_duration_minutes, "active"),
    )
    conn.commit()
    journey_id = cursor.lastrowid

    row = conn.execute("SELECT * FROM journeys WHERE id = ?", (journey_id,)).fetchone()
    conn.close()

    return _compute_journey_fields(dict(row))


@app.put("/api/journey/{journey_id}/safe", response_model=JourneyResponse)
def mark_safe(journey_id: int):
    """Mark a journey as safely completed."""
    conn = get_db()
    row = conn.execute("SELECT * FROM journeys WHERE id = ?", (journey_id,)).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Journey not found")

    if row["status"] != "active":
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Journey is already marked as '{row['status']}' and cannot be updated",
        )

    conn.execute("UPDATE journeys SET status = 'safe' WHERE id = ?", (journey_id,))
    conn.commit()

    row = conn.execute("SELECT * FROM journeys WHERE id = ?", (journey_id,)).fetchone()
    conn.close()

    return _compute_journey_fields(dict(row))


@app.post("/api/journey/{journey_id}/note", response_model=NoteResponse)
def log_note(journey_id: int, note_data: NoteCreate):
    """Analyze a journey note with local AI (vaderSentiment) for distress/emergency detection."""
    conn = get_db()
    row = conn.execute("SELECT * FROM journeys WHERE id = ?", (journey_id,)).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Journey not found")

    scores = sia.polarity_scores(note_data.note)
    compound_score = round(float(scores["compound"]), 4)
    is_distress = compound_score <= -0.4

    current_status = row["status"]
    new_status = current_status

    if is_distress and current_status == "active":
        conn.execute("UPDATE journeys SET status = 'sos' WHERE id = ?", (journey_id,))
        conn.commit()
        new_status = "sos"

    row = conn.execute("SELECT * FROM journeys WHERE id = ?", (journey_id,)).fetchone()
    conn.close()

    journey_resp = _compute_journey_fields(dict(row))

    return NoteResponse(
        journey_id=journey_id,
        status=new_status,
        sentiment_score=compound_score,
        is_distress=is_distress,
        journey=journey_resp,
    )


@app.get("/api/journeys", response_model=list[JourneyResponse])
def get_journeys():
    """Return all journeys with computed status (expired active journeys become SOS)."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM journeys ORDER BY id DESC").fetchall()
    conn.close()

    return [_compute_journey_fields(dict(row)) for row in rows]


# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse

# Mount React Frontend static build directory with SPA fallback for direct subroute access
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
if not os.path.exists(frontend_dist):
    frontend_dist = "frontend/dist"

assets_dir = os.path.join(frontend_dist, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve static files or fallback to index.html for client-side routing."""
    file_path = os.path.join(frontend_dist, full_path)
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)

    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)

    return {"message": "SafeJourney API is running. Build frontend to view web UI."}


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
