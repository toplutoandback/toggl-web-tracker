# Toggl Web Tracker

Web-based time tracking app with Toggl import, alarms, and analytics.

## Quick Start

1. Backend:
```bash
cd /home/eds-admin/toggl-desktop
source venv/bin/activate
pip install passlib python-jose[cryptography]
uvicorn backend.app:app --reload --port 8000
```

2. Frontend:
```bash
cd frontend
npm install
npm run dev
```

3. Login: admin@local / admin123

## Features
- JWT authentication for 10 users
- Real-time timer
- Toggl API import
- Project performance analysis
- User utilization reports
- Multi-user support

## API Endpoints
- POST /token - Login
- GET /time_entries - List entries
- POST /time_entries - Create entry
- POST /import/toggl - Import from Toggl
- GET /analysis/projects - Project hours
- GET /analysis/users - User utilization
