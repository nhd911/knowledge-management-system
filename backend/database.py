from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

db = Database()

async def get_database():
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    # MongoDB connection string - you can set this as environment variable
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "knowledge_management")
    
    db.client = AsyncIOMotorClient(MONGODB_URL, server_api=ServerApi('1'))
    db.database = db.client[DATABASE_NAME]
    
    # Test the connection
    try:
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()

# Create indexes for better performance
async def create_indexes():
    """Create database indexes"""
    # if db.database:
        # User indexes
    await db.database.users.create_index("username", unique=True)
    await db.database.users.create_index("email", unique=True)
    
    # Document indexes
    await db.database.documents.create_index("title")
    await db.database.documents.create_index("tags")
    await db.database.documents.create_index("created_at")
    await db.database.documents.create_index("owner_id")
    await db.database.documents.create_index("visibility")
    
    print("Database indexes created successfully!")
