from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    source = Column(String, nullable=False)
    link = Column(String, nullable=False)
    last_date = Column(String, nullable=True)
    posted_on = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    notification_id = Column(Integer, nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow)