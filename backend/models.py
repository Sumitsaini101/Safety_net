from pydantic import BaseModel, Field
from typing import Optional


class JourneyCreate(BaseModel):
    """Request body for creating a new journey."""
    destination: str = Field(..., min_length=1, max_length=200, description="Destination name")
    expected_duration_minutes: int = Field(..., gt=0, le=1440, description="Expected duration in minutes")


class JourneyResponse(BaseModel):
    """Response model for a journey."""
    id: int
    destination: str
    start_time: str
    expected_duration_minutes: int
    status: str
    is_expired: bool = False
    remaining_seconds: Optional[int] = None
