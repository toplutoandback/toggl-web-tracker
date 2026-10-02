from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from . import db, models
from .toggl_importer import import_toggl_data
from .analysis import project_performance, user_utilization

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="Toggl Web Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    db.create_tables()
    # Create default admin user if not exists
    session = db.SessionLocal()
    if not session.query(models.User).filter_by(email="admin@local").first():
        admin = models.User(
            email="admin@local",
            name="Admin",
            hashed_password=pwd_context.hash("admin123")
        )
        session.add(admin)
        session.commit()
    session.close()

def verify_password(plain, hashed):
    # bcrypt has 72-byte limit
    if len(plain.encode('utf-8')) > 72:
        plain = plain.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    # bcrypt has 72-byte limit
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    session = db.SessionLocal()
    user = session.query(models.User).filter(models.User.email == email).first()
    session.close()
    if user is None:
        raise credentials_exception
    return user

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    session = db.SessionLocal()
    user = session.query(models.User).filter(models.User.email == form_data.username).first()
    session.close()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/import/toggl")
def import_toggl(api_token: str, workspace_id: int, user: models.User = Depends(get_current_user)):
    count = import_toggl_data(api_token, workspace_id, user.id)
    return {"imported": count}

@app.get("/time_entries")
def get_entries(skip: int = 0, limit: int = 100, user: models.User = Depends(get_current_user), db_session: Session = Depends(db.get_session)):
    entries = db_session.query(models.TimeEntry).filter(models.TimeEntry.user_id == user.id).offset(skip).limit(limit).all()
    return entries

@app.post("/time_entries")
def create_entry(entry: dict, user: models.User = Depends(get_current_user), db_session: Session = Depends(db.get_session)):
    new_entry = models.TimeEntry(
        user_id=user.id,
        project_id=entry.get("project_id"),
        description=entry.get("description"),
        start_time=datetime.fromisoformat(entry["start_time"]),
        duration_seconds=entry.get("duration_seconds", 0),
        billable=entry.get("billable", False)
    )
    db_session.add(new_entry)
    db_session.commit()
    return new_entry

@app.get("/analysis/projects")
def analysis_projects(user: models.User = Depends(get_current_user), db_session: Session = Depends(db.get_session)):
    return project_performance(db_session)

@app.get("/analysis/users")
def analysis_users(user: models.User = Depends(get_current_user), db_session: Session = Depends(db.get_session)):
    return user_utilization(db_session)

@app.get("/users")
def list_users(current_user: models.User = Depends(get_current_user)):
    if current_user.email != "admin@local":
        raise HTTPException(status_code=403, detail="Admin only")
    session = db.SessionLocal()
    users = session.query(models.User).all()
    session.close()
    return [{"id": u.id, "name": u.name, "email": u.email} for u in users]
