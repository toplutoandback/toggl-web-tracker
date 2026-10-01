import requests
from datetime import datetime
from sqlalchemy.orm import Session
from . import db, models

TOGGL_API = "https://api.track.toggl.com/api/v9"

def import_toggl_data(api_token, workspace_id, db_session=None):
    if db_session is None:
        db_session = db.SessionLocal()
    
    headers = {"Authorization": f"Basic {api_token}:api_token"}
    
    # Fetch time entries
    url = f"{TOGGL_API}/workspaces/{workspace_id}/time_entries"
    params = {"page": 1, "per_page": 100}
    imported = 0
    
    while True:
        r = requests.get(url, headers=headers, params=params)
        if r.status_code != 200:
            break
        entries = r.json()
        if not entries:
            break
        
        for e in entries:
            # Upsert user
            user = db_session.query(models.User).filter_by(toggl_id=str(e['wid'])).first()
            # Simplified mapping - real mapping needed
            if not user:
                user = models.User(toggl_id=str(e.get('uid')), name=e.get('description',''))
                db_session.add(user)
                db_session.flush()
            
            # Upsert project
            proj = None
            if e.get('pid'):
                proj = db_session.query(models.Project).filter_by(toggl_id=str(e['pid'])).first()
                if not proj:
                    proj = models.Project(toggl_id=str(e['pid']), name=e.get('project',''))
                    db_session.add(proj)
                    db_session.flush()
            
            # Create time entry
            te = models.TimeEntry(
                toggl_id=str(e['id']),
                user_id=user.id,
                project_id=proj.id if proj else None,
                description=e.get('description'),
                start_time=datetime.fromisoformat(e['start'].replace('Z','+00:00')),
                duration_seconds=e.get('durations',0),
                billable=e.get('billable',False),
                tags=','.join(e.get('tags',[]))
            )
            db_session.add(te)
            imported += 1
        
        db_session.commit()
        params['page'] += 1
    
    return imported
