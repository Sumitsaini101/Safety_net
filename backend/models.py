# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from typing import Optional


class JourneyCreate(BaseModel):
    """Request body for creating a new journey."""
    destination: str = Field(..., min_length=1, max_length=200, description="Destination name")
    expected_duration_minutes: int = Field(..., gt=0, le=1440, description="Expected duration in minutes")
    latitude: Optional[float] = Field(None, description="GPS Latitude coordinate")
    longitude: Optional[float] = Field(None, description="GPS Longitude coordinate")


class JourneyResponse(BaseModel):
    """Response model for a journey."""
    id: int
    destination: str
    start_time: str
    expected_duration_minutes: int
    status: str
    is_expired: bool = False
    remaining_seconds: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class NoteCreate(BaseModel):
    """Request body for logging a note on an active journey."""
    note: str = Field(..., min_length=1, description="Note text to analyze for sentiment/distress")


class NoteResponse(BaseModel):
    """Response model after AI note sentiment analysis."""
    journey_id: int
    status: str
    sentiment_score: float
    is_distress: bool
    journey: JourneyResponse
