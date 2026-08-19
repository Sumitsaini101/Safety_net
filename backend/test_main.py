import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import init_db

# Initialize database schema before tests
init_db()

client = TestClient(app)


def test_root_endpoint():
    """Test that the root endpoint serves the frontend with HTTP 200."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"


def test_nlp_endpoint_safe_note():
    """Test that a normal transit note is analyzed with status 'active' and is_distress=False."""
    # 1. Create an active journey
    create_resp = client.post(
        "/api/journey",
        json={
            "destination": "Central Metro Station",
            "expected_duration_minutes": 30,
            "latitude": 28.6139,
            "longitude": 77.2090,
        },
    )
    assert create_resp.status_code == 201
    journey_id = create_resp.json()["id"]

    # 2. Log a safe note
    note_resp = client.post(
        f"/api/journey/{journey_id}/note",
        json={"note": "Boarded the bus safely, smooth ride home."},
    )
    assert note_resp.status_code == 200
    data = note_resp.json()
    assert data["status"] == "active"
    assert data["is_distress"] is False
    assert data["sentiment_score"] > 0


def test_nlp_endpoint_distress_note():
    """Test that a distress/threat note triggers emergency escalation to status 'sos' and is_distress=True."""
    # 1. Create an active journey
    create_resp = client.post(
        "/api/journey",
        json={
            "destination": "Late Night Walk",
            "expected_duration_minutes": 20,
            "latitude": 28.6139,
            "longitude": 77.2090,
        },
    )
    assert create_resp.status_code == 201
    journey_id = create_resp.json()["id"]

    # 2. Log an explicit distress note
    note_resp = client.post(
        f"/api/journey/{journey_id}/note",
        json={"note": "Emergency! Someone is attacking me and threatening to kill me!"},
    )
    assert note_resp.status_code == 200
    data = note_resp.json()
    assert data["status"] == "sos"
    assert data["is_distress"] is True
    assert data["sentiment_score"] <= -0.4
