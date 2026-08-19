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


def test_root_endpoint_and_security_headers():
    """Test that the root endpoint serves frontend with HTTP 200 and all security headers."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_create_journey_with_gps():
    """Test creating a journey with GPS coordinates and verifying returned schema."""
    resp = client.post(
        "/api/journey",
        json={
            "destination": "Connaught Place Metro",
            "expected_duration_minutes": 25,
            "latitude": 28.6315,
            "longitude": 77.2167,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["destination"] == "Connaught Place Metro"
    assert data["expected_duration_minutes"] == 25
    assert data["status"] == "active"
    assert data["latitude"] == 28.6315
    assert data["longitude"] == 77.2167
    assert data["remaining_seconds"] > 0
    assert data["is_expired"] is False


def test_create_journey_without_gps():
    """Test creating a journey without GPS coordinates (optional fields)."""
    resp = client.post(
        "/api/journey",
        json={
            "destination": "Home Office",
            "expected_duration_minutes": 15,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["destination"] == "Home Office"
    assert data["status"] == "active"
    assert data["latitude"] is None
    assert data["longitude"] is None


def test_mark_journey_safe():
    """Test marking an active journey as safe."""
    create_resp = client.post(
        "/api/journey",
        json={"destination": "University Campus", "expected_duration_minutes": 20},
    )
    assert create_resp.status_code == 201
    journey_id = create_resp.json()["id"]

    safe_resp = client.put(f"/api/journey/{journey_id}/safe")
    assert safe_resp.status_code == 200
    safe_data = safe_resp.json()
    assert safe_data["status"] == "safe"
    assert safe_data["remaining_seconds"] == 0


def test_mark_safe_invalid_states():
    """Test 404 on non-existent journey and 400 when re-marking an already safe journey."""
    # 404 for non-existent ID
    resp_404 = client.put("/api/journey/999999/safe")
    assert resp_404.status_code == 404

    # Create and mark safe
    create_resp = client.post(
        "/api/journey",
        json={"destination": "Gym", "expected_duration_minutes": 10},
    )
    journey_id = create_resp.json()["id"]
    client.put(f"/api/journey/{journey_id}/safe")

    # 400 for already safe
    repeat_safe = client.put(f"/api/journey/{journey_id}/safe")
    assert repeat_safe.status_code == 400
    assert "already marked" in repeat_safe.json()["detail"]


def test_nlp_endpoint_safe_note():
    """Test that a normal transit note is analyzed with status 'active' and is_distress=False."""
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

    note_resp = client.post(
        f"/api/journey/{journey_id}/note",
        json={"note": "Emergency! Someone is attacking me and threatening to kill me!"},
    )
    assert note_resp.status_code == 200
    data = note_resp.json()
    assert data["status"] == "sos"
    assert data["is_distress"] is True
    assert data["sentiment_score"] <= -0.4


def test_nlp_note_on_nonexistent_journey():
    """Test 404 when logging note on a journey that does not exist."""
    resp = client.post(
        "/api/journey/999999/note",
        json={"note": "Checking in"},
    )
    assert resp.status_code == 404


def test_get_all_journeys():
    """Test fetching all journeys list with computed statuses and sorted descending."""
    resp = client.get("/api/journeys")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Verify required keys in response
    first = data[0]
    for key in ["id", "destination", "status", "start_time", "expected_duration_minutes", "is_expired"]:
        assert key in first


def test_pydantic_validation_errors():
    """Test that invalid payloads are rejected with 422 Unprocessable Entity."""
    # Empty destination
    bad_dest = client.post(
        "/api/journey",
        json={"destination": "", "expected_duration_minutes": 20},
    )
    assert bad_dest.status_code == 422

    # Negative / zero duration
    bad_duration = client.post(
        "/api/journey",
        json={"destination": "Valid Name", "expected_duration_minutes": 0},
    )
    assert bad_duration.status_code == 422
