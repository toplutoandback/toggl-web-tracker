# Toggl Web Tracker - Render Deployment

## Files created:
- `render.yaml` - Render blueprint for auto-deploy
- `requirements.txt` - Python dependencies
- `package.json` - Node dependencies
- `.env.example` - Environment variables template

## Deploy to Render:

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/toggl-web-tracker.git
git push -u origin main
```

2. Go to render.com → New → Blueprint
3. Connect GitHub repo
4. Render auto-detects `render.yaml`
5. Set SECRET_KEY in environment variables
6. Deploy!

## Alternative: Manual Deploy

**Backend (Render Web Service):**
- Build: `pip install -r requirements.txt`
- Start: `gunicorn backend.app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

**Frontend (Render Static Site):**
- Build: `npm install && npm run build`
- Publish directory: `frontend/dist`

**Database:**
- Render PostgreSQL (free tier)
- Or use Neon.tech (free PostgreSQL)

## Cost:
- Free tier: 750 hours/month (enough for 10 users)
- Paid: $7/mo for always-on

## Next steps:
1. Create GitHub repo
2. Push code
3. Deploy to Render
4. Add your 10 users via admin panel
