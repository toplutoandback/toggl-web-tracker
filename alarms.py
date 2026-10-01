import schedule
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend import db, models

def check_alarms():
    db_session = db.SessionLocal()
    
    # Check for running timers > 4 hours
    # Check daily goals
    # Send notifications
    
    db_session.close()

schedule.every().day.at("09:00").do(check_alarms)
schedule.every().day.at("17:00").do(check_alarms)

if __name__ == "__main__":
    import time
    while True:
        schedule.run_pending()
        time.sleep(60)
