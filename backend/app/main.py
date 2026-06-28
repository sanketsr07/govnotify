from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from . import models
from .database import engine, get_db
from .scraper import run_all_scrapers
from .auth import hash_password, verify_password, create_token, decode_token

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class RegisterSchema(BaseModel):
    name: str
    email: str
    password: str

class LoginSchema(BaseModel):
    email: str
    password: str

class BookmarkSchema(BaseModel):
    token: str
    notification_id: int

# --- Routes ---
@app.get("/")
def root():
    return {"message": "GovNotify API is running!"}

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    return db.query(models.Notification).all()

@app.post("/scrape")
def scrape_now(db: Session = Depends(get_db)):
    results = run_all_scrapers()
    added = 0
    for item in results:
        exists = db.query(models.Notification).filter_by(title=item["title"]).first()
        if not exists:
            notif = models.Notification(**item)
            db.add(notif)
            added += 1
    db.commit()
    return {"message": f"Scraping done. {added} new notifications added."}

@app.post("/add-test-data")
def add_test_data(db: Session = Depends(get_db)):
    test_data = [
        {"title": "Karnataka Police Constable Recruitment 2026", "category": "Police", "source": "Karnataka Police", "link": "https://www.ksp.karnataka.gov.in", "last_date": "03 July 2026"},
        {"title": "Indian Army Agniveer Recruitment 2027", "category": "Army", "source": "Indian Army", "link": "https://joinindianarmy.nic.in", "last_date": "Coming Soon"},
        {"title": "SSC GD Constable Recruitment 2026", "category": "SSC", "source": "SSC", "link": "https://ssc.nic.in", "last_date": "December 2026"},
        {"title": "RPF Constable Recruitment 2026", "category": "Railway", "source": "RPF", "link": "https://indianrailways.gov.in", "last_date": "TBA"},
        {"title": "SBI Clerk Recruitment 2026", "category": "Banking", "source": "SBI", "link": "https://sbi.co.in/careers", "last_date": "August 2026"},
        {"title": "IBPS PO Recruitment 2026", "category": "Banking", "source": "IBPS", "link": "https://ibps.in", "last_date": "September 2026"},
        {"title": "UPSC Civil Services 2027", "category": "UPSC", "source": "UPSC", "link": "https://upsc.gov.in", "last_date": "February 2027"},
        {"title": "India Post GDS Recruitment 2026", "category": "Post Office", "source": "India Post", "link": "https://indiapost.gov.in", "last_date": "October 2026"},
        {"title": "KPSC Group C Recruitment 2026", "category": "KPSC", "source": "KPSC", "link": "https://kpsc.kar.nic.in", "last_date": "November 2026"},
        {"title": "Karnataka Armed Police CAR/DAR 2026", "category": "Police", "source": "Karnataka Police", "link": "https://www.ksp.karnataka.gov.in", "last_date": "22 July 2026"},
    ]
    for item in test_data:
        exists = db.query(models.Notification).filter_by(title=item["title"]).first()
        if not exists:
            db.add(models.Notification(**item))
    db.commit()
    return {"message": "Test data added!"}

@app.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter_by(email=data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token({"user_id": user.id, "name": user.name})
    return {"token": token, "name": user.name}

@app.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"user_id": user.id, "name": user.name})
    return {"token": token, "name": user.name}

@app.post("/bookmark")
def add_bookmark(data: BookmarkSchema, db: Session = Depends(get_db)):
    payload = decode_token(data.token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    exists = db.query(models.Bookmark).filter_by(
        user_id=payload["user_id"],
        notification_id=data.notification_id
    ).first()
    if exists:
        return {"message": "Already bookmarked"}
    db.add(models.Bookmark(user_id=payload["user_id"], notification_id=data.notification_id))
    db.commit()
    return {"message": "Bookmarked!"}

@app.get("/bookmarks/{token}")
def get_bookmarks(token: str, db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    bookmarks = db.query(models.Bookmark).filter_by(user_id=payload["user_id"]).all()
    ids = [b.notification_id for b in bookmarks]
    return db.query(models.Notification).filter(models.Notification.id.in_(ids)).all()