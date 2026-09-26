import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Reads DATABASE_URL from environment (see .env.example).
# Example for Postgres: postgresql://user:password@localhost:5432/support_ai
# If not set (or unparseable), falls back to a local SQLite file so the backend runs.
raw_url = (os.getenv("DATABASE_URL") or "").strip().strip('"').strip("'")

# Render/Heroku sometimes provide postgres:// which SQLAlchemy 2.x rejects.
if raw_url.startswith("postgres://"):
    raw_url = "postgresql://" + raw_url[len("postgres://"):]

try:
    DATABASE_URL = raw_url or "sqlite:///./local_dev.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
except Exception as exc:  # noqa: BLE001
    print(f"WARNING: Could not parse DATABASE_URL ({exc}). Falling back to SQLite.")
    DATABASE_URL = "sqlite:///./local_dev.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
