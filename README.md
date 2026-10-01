# Toggl Desktop Tracker - Windows 10 Desktop App

## Setup Instructions

1. Install Python 3.10+ and Node.js 18+
2. Create virtual environment: `python -m venv venv`
3. Install backend deps: `pip install fastapi uvicorn sqlalchemy alembic python-multipart psycopg2-binary requests pydantic`
4. Install frontend deps: `cd frontend && npm install`
5. Run backend: `uvicorn backend.app:app --reload --port 8000`
6. Run frontend: `cd frontend && npm run dev`
7. Run Electron: `npm run electron`

## Toggl API Setup

1. Get API token from https://track.toggl.com/profile
2. Get workspace ID from Toggl URL
3. Use import endpoint: POST /import/toggl?api_token=XXX&workspace_id=YYY

## Features

- Import Toggl time entries via API
- Track time with desktop app
- Alarms for project performance
- Analysis dashboards
- Multi-user support (10 users)

## Database

SQLite by default, can switch to PostgreSQL via DATABASE_URL env var
