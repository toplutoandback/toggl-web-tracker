import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./toggl.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    import models
    models.Base.metadata.create_all(bind=engine)
