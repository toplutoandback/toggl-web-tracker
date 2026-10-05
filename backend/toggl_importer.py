import requests
import base64
from datetime import datetime
from sqlalchemy.orm import Session
from . import db, models

TOGGL_API = "https://api.track.toggl.com/api/v9"
TOGGL_REPORTS_API = "https://api.track.toggl.com/reports/api/v3"

def import_toggl_data(api_token, workspace_id, db_session=None):
    if db_session is None:
        db_session = db.SessionLocal()
    
    auth_str = f"{api_token}:api_token"
    encoded = base64.b64encode(auth_str.encode()).decode()
    headers = {"Authorization": f"Basic {encoded}", "Content-Type": "application/json"}
    
    # Use Reports API for workspace-wide time entries
    url = f"{TOGGL_REPORTS_API}/workspace/{workspace_id}/search/time_entries"
    params = {
        "page": 1,
        "per_page": 100,
        "start_date": "2026-01-01",
        "end_date": "2026-04-01"
    }
    imported = 0
    
    while True:
        r = requests.post(url, headers=headers, json=params)
        if r.status_code != 200:
            break
        entries = r.json()
        if not entries:
            break
        
        for e in entries:
            # Each entry contains time_entries array
            for time_entry in e.get('time_entries', []):
                try:
                    # Upsert user
                    user = db_session.query(models.User).filter_by(toggl_id=str(e['user_id'])).first()
                    if not user:
                        user = models.User(toggl_id=str(e.get('user_id')), name=e.get('username',''))
                        db_session.add(user)
                        db_session.flush()
                    
                    # Upsert project
                    proj = None
                    if e.get('project_id'):
                        proj = db_session.query(models.Project).filter_by(toggl_id=str(e['project_id'])).first()
                        if not proj:
                            proj = models.Project(toggl_id=str(e['project_id']), name='')
                            db_session.add(proj)
                            db_session.flush()
                    
                    # Create time entry
                    start_time = datetime.fromisoformat(time_entry['start'])
                    te = models.TimeEntry(
                        toggl_id=str(time_entry['id']),
                        user_id=user.id,
                        project_id=proj.id if proj else None,
                        description=e.get('description', ''),
                        start_time=start_time,
                        duration_seconds=time_entry.get('seconds',0),
                        billable=e.get('billable',False),
                        tags=''
                    )
                    db_session.add(te)
                    imported += 1
                except Exception as ex:
                    print(f"Error importing time entry: {ex}")
                    continue
        
        db_session.commit()
        params['page'] += 1
    
    return imported
