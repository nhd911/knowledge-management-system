from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from datetime import datetime, timedelta
import os
from typing import Optional, List
import jwt
from passlib.context import CryptContext

from database import connect_to_mongo, close_mongo_connection, create_indexes, get_database
from models import User, Document, DocumentCreate, UserCreate, UserLogin, DocumentResponse
from auth import create_access_token, verify_token, get_current_user
from routes import auth, documents, ratings, ai

app = FastAPI(title="Knowledge Management System", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded documents
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

security = HTTPBearer()

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    await create_indexes()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(ratings.router)
app.include_router(ai.router)

@app.get("/")
async def root():
    return {"message": "Knowledge Management System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
