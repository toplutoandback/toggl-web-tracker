from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    toggl_id = Column(String, unique=True)
    name = Column(String)
    email = Column(String, unique=True)
    hashed_password = Column(String)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    toggl_id = Column(String, unique=True)
    name = Column(String)
    client_id = Column(String)

class TimeEntry(Base):
    __tablename__ = "time_entries"
    id = Column(Integer, primary_key=True)
    toggl_id = Column(String, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    description = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration_seconds = Column(Integer)
    billable = Column(Boolean, default=False)
    tags = Column(String)

    user = relationship("User")
    project = relationship("Project")
