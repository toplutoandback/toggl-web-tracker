import requests
import base64
from datetime import datetime
from sqlalchemy.orm import Session
from . import db, models

TOGGL_API = "https://api.track.toggl.com/api/v9"
TOGGL_REPORTS_API = "https://api.track.toggl.com/reports/api/v3"

def import_toggl_data(api_token, workspace_id, db_session: Session):
    auth_str = f"{api_token}:api_token"
    encoded = base64.b64encode(auth_str.encode()).decode()
    headers = {"Authorization": f"Basic {encoded}", "Content-Type": "application/json"}
    
    # First, fetch users from workspace
    users_url = f"{TOGGL_REPORTS_API}/workspace/{workspace_id}/search/users"
    users_params = {
        "page": 1,
        "per_page": 100
    }
    
    users = {}
    r = requests.post(users_url, headers=headers, json=users_params)
    if r.status_code == 200:
        users_data = r.json()
        for user in users_data:
            users[user['id']] = user.get('name', '')
            # Import users into database
            existing_user = db_session.query(models.User).filter_by(toggl_id=str(user['id'])).first()
            if not existing_user:
                new_user = models.User(
                    email=f"{user.get('email', user['id'])}@toggl.local",
                    name=user.get('name', 'Unknown'),
                    toggl_id=str(user['id'])
                )
                db_session.add(new_user)
    
    # Fetch projects from workspace
    projects_url = f"{TOGGL_REPORTS_API}/workspace/{workspace_id}/search/projects"
    projects_params = {
        "page": 1,
        "per_page": 100
    }
    
    projects = {}
    r = requests.post(projects_url, headers=headers, json=projects_params)
    if r.status_code == 200:
        projects_data = r.json()
        for project in projects_data:
            projects[project['id']] = project.get('name', '')
            # Import projects into database
            existing_project = db_session.query(models.Project).filter_by(toggl_id=str(project['id'])).first()
            if not existing_project:
                new_project = models.Project(
                    name=project.get('name', 'Unknown'),
                    toggl_id=str(project['id']),
                    workspace_id=workspace_id
                )
                db_session.add(new_project)
    
    db_session.commit()
    
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
                    # Get user
                    user_id = time_entry.get('user_id')
                    user = db_session.query(models.User).filter_by(toggl_id=str(user_id)).first()
                    if not user:
                        # Create user if not exists
                        user_name = users.get(user_id, 'Unknown')
                        user = models.User(
                            email=f"{user_id}@toggl.local",
                            name=user_name,
                            toggl_id=str(user_id)
                        )
                        db_session.add(user)
                        db_session.flush()
                    
                    # Get project
                    project_id = time_entry.get('project_id')
                    project = None
                    if project_id:
                        project = db_session.query(models.Project).filter_by(toggl_id=str(project_id)).first()
                        if not project:
                            project_name = projects.get(project_id, 'Unknown')
                            project = models.Project(
                                name=project_name,
                                toggl_id=str(project_id),
                                workspace_id=workspace_id
                            )
                            db_session.add(project)
                            db_session.flush()
                    
                    # Parse dates
                    start = datetime.fromisoformat(time_entry['start'].replace('Z', '+00:00'))
                    stop = datetime.fromisoformat(time_entry['stop'].replace('Z', '+00:00'))
                    duration = (stop - start).total_seconds()
                    
                    # Create time entry
                    new_entry = models.TimeEntry(
                        user_id=user.id,
                        project_id=project.id if project else None,
                        description=time_entry.get('description', ''),
                        start_time=start,
                        end_time=stop,
                        duration=duration,
                        toggl_id=str(time_entry.get('id'))
                    )
                    db_session.add(new_entry)
                    imported += 1
                    
                except Exception as ex:
                    print(f"Error importing time entry: {ex}")
                    continue
        
        params['page'] += 1
        if params['page'] > 2:  # Limit for testing
            break
    
    db_session.commit()
    return imported
