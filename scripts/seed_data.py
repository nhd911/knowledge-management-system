"""
Seed script to populate the database with initial test data
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import bcrypt
from bson import ObjectId

# Database configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "knowledge_management")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def seed_database():
    """Seed database with initial test data"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print(f"🌱 Seeding database: {DATABASE_NAME}")
    
    try:
        # Clear existing data (optional - comment out if you want to keep existing data)
        # await db.users.delete_many({})
        # await db.documents.delete_many({})
        # await db.ratings.delete_many({})
        # print("🗑️ Cleared existing data")
        
        # Create test users
        test_users = [
            {
                "_id": ObjectId(),
                "username": "admin",
                "email": "admin@company.com",
                "full_name": "System Administrator",
                "department": "IT",
                "group": "admin",
                "password": hash_password("admin123"),
                "created_at": datetime.utcnow(),
                "is_active": True
            },
            {
                "_id": ObjectId(),
                "username": "john_doe",
                "email": "john.doe@company.com",
                "full_name": "John Doe",
                "department": "Engineering",
                "group": "developers",
                "password": hash_password("password123"),
                "created_at": datetime.utcnow(),
                "is_active": True
            },
            {
                "_id": ObjectId(),
                "username": "jane_smith",
                "email": "jane.smith@company.com",
                "full_name": "Jane Smith",
                "department": "Marketing",
                "group": "marketing",
                "password": hash_password("password123"),
                "created_at": datetime.utcnow(),
                "is_active": True
            },
            {
                "_id": ObjectId(),
                "username": "bob_wilson",
                "email": "bob.wilson@company.com",
                "full_name": "Bob Wilson",
                "department": "Sales",
                "group": "sales",
                "password": hash_password("password123"),
                "created_at": datetime.utcnow(),
                "is_active": True
            }
        ]
        
        # Insert users if they don't exist
        for user in test_users:
            existing_user = await db.users.find_one({"username": user["username"]})
            if not existing_user:
                await db.users.insert_one(user)
                print(f"👤 Created user: {user['username']}")
            else:
                print(f"👤 User already exists: {user['username']}")
        
        # Get user IDs for document creation
        admin_user = await db.users.find_one({"username": "admin"})
        john_user = await db.users.find_one({"username": "john_doe"})
        jane_user = await db.users.find_one({"username": "jane_smith"})
        
        # Create test documents
        test_documents = [
            {
                "_id": ObjectId(),
                "title": "Company Onboarding Guide",
                "summary": "Comprehensive guide for new employees covering company policies, procedures, and culture.",
                "tags": ["onboarding", "hr", "policies", "new-employee"],
                "visibility": "public",
                "owner_id": admin_user["_id"],
                "file_type": "pdf",
                "file_size": 2048000,
                "created_at": datetime.utcnow() - timedelta(days=30),
                "updated_at": datetime.utcnow() - timedelta(days=30),
                "rating_sum": 20,
                "rating_count": 5,
                "average_rating": 4.0
            },
            {
                "_id": ObjectId(),
                "title": "API Documentation v2.1",
                "summary": "Technical documentation for the company's REST API including endpoints, authentication, and examples.",
                "tags": ["api", "documentation", "technical", "development"],
                "visibility": "group",
                "owner_id": john_user["_id"],
                "file_type": "pdf",
                "file_size": 1536000,
                "created_at": datetime.utcnow() - timedelta(days=15),
                "updated_at": datetime.utcnow() - timedelta(days=10),
                "rating_sum": 22,
                "rating_count": 6,
                "average_rating": 3.7
            },
            {
                "_id": ObjectId(),
                "title": "Marketing Strategy 2024",
                "summary": "Strategic marketing plan for 2024 including target audiences, campaigns, and budget allocation.",
                "tags": ["marketing", "strategy", "2024", "campaigns"],
                "visibility": "group",
                "owner_id": jane_user["_id"],
                "file_type": "docx",
                "file_size": 1024000,
                "created_at": datetime.utcnow() - timedelta(days=7),
                "updated_at": datetime.utcnow() - timedelta(days=5),
                "rating_sum": 15,
                "rating_count": 3,
                "average_rating": 5.0
            },
            {
                "_id": ObjectId(),
                "title": "Security Best Practices",
                "summary": "Guidelines and best practices for maintaining security in software development and operations.",
                "tags": ["security", "best-practices", "development", "operations"],
                "visibility": "public",
                "owner_id": admin_user["_id"],
                "file_type": "pdf",
                "file_size": 3072000,
                "created_at": datetime.utcnow() - timedelta(days=3),
                "updated_at": datetime.utcnow() - timedelta(days=1),
                "rating_sum": 25,
                "rating_count": 5,
                "average_rating": 5.0
            }
        ]
        
        # Insert documents if they don't exist
        for doc in test_documents:
            existing_doc = await db.documents.find_one({"title": doc["title"]})
            if not existing_doc:
                await db.documents.insert_one(doc)
                print(f"📄 Created document: {doc['title']}")
            else:
                print(f"📄 Document already exists: {doc['title']}")
        
        print("✅ Database seeding completed successfully!")
        print("\n📋 Test Accounts Created:")
        print("Username: admin | Password: admin123 | Role: Administrator")
        print("Username: john_doe | Password: password123 | Department: Engineering")
        print("Username: jane_smith | Password: password123 | Department: Marketing")
        print("Username: bob_wilson | Password: password123 | Department: Sales")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
