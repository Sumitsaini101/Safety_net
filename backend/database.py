import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "safejourney.db")


def get_db():
    """Get a database connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Initialize the database and create/migrate tables if they don't exist."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS journeys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            destination TEXT NOT NULL,
            start_time TEXT NOT NULL,
            expected_duration_minutes INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'safe', 'sos')),
            latitude REAL,
            longitude REAL
        )
    """)
    conn.commit()

    # Migration for existing databases: check if latitude and longitude exist
    cursor = conn.execute("PRAGMA table_info(journeys)")
    columns = [row["name"] for row in cursor.fetchall()]
    if "latitude" not in columns:
        conn.execute("ALTER TABLE journeys ADD COLUMN latitude REAL")
    if "longitude" not in columns:
        conn.execute("ALTER TABLE journeys ADD COLUMN longitude REAL")
    conn.commit()
    conn.close()
