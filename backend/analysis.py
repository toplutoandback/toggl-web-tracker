from sqlalchemy.orm import Session
from . import models

def project_performance(db: Session):
    results = db.query(
        models.Project.name,
        models.Project.client_id,
        db.func.sum(models.TimeEntry.duration_seconds).label('total_seconds')
    ).join(models.TimeEntry).group_by(models.Project.id).all()
    
    return [
        {
            "project": r[0],
            "client": r[1],
            "hours": round(r[2]/3600,2) if r[2] else 0
        }
        for r in results
    ]

def user_utilization(db: Session):
    results = db.query(
        models.User.name,
        db.func.sum(models.TimeEntry.duration_seconds).label('total_seconds')
    ).join(models.TimeEntry).group_by(models.User.id).all()
    
    return [
        {
            "user": r[0],
            "hours": round(r[1]/3600,2) if r[1] else 0
        }
        for r in results
    ]
