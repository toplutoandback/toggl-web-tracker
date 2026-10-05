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
                    # Just count entries, don't actually import for now
                    imported += 1
                except Exception as ex:
                    print(f"Error importing time entry: {ex}")
                    continue
        
        params['page'] += 1
        if params['page'] > 2:  # Limit for testing
            break
    
    return imported
