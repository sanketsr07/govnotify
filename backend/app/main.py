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
    allow_origins=["https://govnotify-xi.vercel.app", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class ChangePasswordSchema(BaseModel):
    token: str
    old_password: str
    new_password: str

class UpdateNameSchema(BaseModel):
    token: str
    name: str

@app.get("/")
def root():
    return {"message": "GovNotify API is running!"}

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    return db.query(models.Notification).all()

@app.post("/add-test-data")
def add_test_data(db: Session = Depends(get_db)):
    test_data = [
        {"title": "Karnataka Police Constable Recruitment 2026", "category": "Police", "source": "Karnataka Police", "link": "https://cetonline.karnataka.gov.in/kea/", "last_date": "03 July 2026"},
        {"title": "Indian Army Agniveer Recruitment 2027", "category": "Army", "source": "Indian Army", "link": "https://joinindianarmy.nic.in/NotificationList.aspx", "last_date": "Coming Soon"},
        {"title": "SSC GD Constable Recruitment 2026", "category": "SSC", "source": "SSC", "link": "https://ssc.gov.in/portal/recruitment-notices", "last_date": "December 2026"},
        {"title": "RPF Constable Recruitment 2026", "category": "Railway", "source": "RPF", "link": "https://rpf.indianrailways.gov.in", "last_date": "TBA"},
        {"title": "SBI Clerk Recruitment 2026", "category": "Banking", "source": "SBI", "link": "https://bank.sbi/web/careers/recruitment", "last_date": "August 2026"},
        {"title": "IBPS PO Recruitment 2026", "category": "Banking", "source": "IBPS", "link": "https://www.ibps.in/recruitment-notification/", "last_date": "September 2026"},
        {"title": "UPSC Civil Services 2027", "category": "UPSC", "source": "UPSC", "link": "https://upsc.gov.in/examinations/active-examinations", "last_date": "February 2027"},
        {"title": "India Post GDS Recruitment 2026", "category": "Post Office", "source": "India Post", "link": "https://indiapostgdsonline.gov.in", "last_date": "October 2026"},
        {"title": "KPSC Group C Recruitment 2026", "category": "KPSC", "source": "KPSC", "link": "https://kpsc.kar.nic.in/recruitment.aspx", "last_date": "November 2026"},
        {"title": "Karnataka Armed Police CAR/DAR 2026", "category": "Police", "source": "Karnataka Police", "link": "https://cetonline.karnataka.gov.in/kea/", "last_date": "22 July 2026"},
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
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token({"user_id": user.id, "name": user.name})
    return {"token": token, "name": user.name}

@app.get("/profile/{token}")
def get_profile(token: str, db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter_by(id=payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    bookmark_count = db.query(models.Bookmark).filter_by(user_id=user.id).count()
    return {
        "name": user.name,
        "email": user.email,
        "joined": user.created_at.strftime("%B %Y"),
        "bookmarks": bookmark_count
    }

@app.post("/change-password")
def change_password(data: ChangePasswordSchema, db: Session = Depends(get_db)):
    payload = decode_token(data.token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter_by(id=payload["user_id"]).first()
    if not user or not verify_password(data.old_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@app.post("/update-name")
def update_name(data: UpdateNameSchema, db: Session = Depends(get_db)):
    payload = decode_token(data.token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter_by(id=payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = data.name
    db.commit()
    new_token = create_token({"user_id": user.id, "name": user.name})
    return {"message": "Name updated!", "token": new_token, "name": user.name}

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
        db.delete(exists)
        db.commit()
        return {"message": "Removed bookmark"}
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