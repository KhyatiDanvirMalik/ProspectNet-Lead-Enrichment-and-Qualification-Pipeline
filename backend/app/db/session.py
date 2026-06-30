from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# If using SQLite (default for local/free Railway volume), we need check_same_thread=False
# If using a Postgres URL in Railway, connect_args remains empty
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency generator for FastAPI routes.
    Ensures that a database session is created for each request
    and properly closed afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()