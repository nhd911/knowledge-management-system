"""
Database initialization script for Knowledge Management System
Creates collections, indexes, and initial data setup
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import bcrypt

# Database configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "knowledge_management")

async def init_database():
    """Initialize MongoDB database with collections and indexes"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print(f"🔗 Connecting to MongoDB at {MONGODB_URL}")
    print(f"📊 Initializing database: {DATABASE_NAME}")
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Create collections
        collections = ["users", "documents", "ratings"]
        
        for collection_name in collections:
            # Check if collection exists
            existing_collections = await db.list_collection_names()
            if collection_name not in existing_collections:
                await db.create_collection(collection_name)
                print(f"📁 Created collection: {collection_name}")
            else:
                print(f"📁 Collection already exists: {collection_name}")
        
        # Create indexes for users collection
        users_collection = db.users
        await users_collection.create_index("username", unique=True)
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("department")
        await users_collection.create_index("group")
        await users_collection.create_index("created_at")
        print("🔍 Created indexes for users collection")
        
        # Create indexes for documents collection
        documents_collection = db.documents
        await documents_collection.create_index("owner_id")
        await documents_collection.create_index("title")
        await documents_collection.create_index("tags")
        await documents_collection.create_index("visibility")
        await documents_collection.create_index("created_at")
        await documents_collection.create_index("updated_at")
        await documents_collection.create_index("average_rating")
        # Text index for search functionality
        await documents_collection.create_index([
            ("title", "text"),
            ("summary", "text"),
            ("tags", "text")
        ])
        print("🔍 Created indexes for documents collection")
        
        # Create indexes for ratings collection
        ratings_collection = db.ratings
        await ratings_collection.create_index("document_id")
        await ratings_collection.create_index("user_id")
        await ratings_collection.create_index("created_at")
        # Compound index to ensure one rating per user per document
        await ratings_collection.create_index([
            ("document_id", 1),
            ("user_id", 1)
        ], unique=True)
        print("🔍 Created indexes for ratings collection")
        
        print("✅ Database initialization completed successfully!")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
