"""
Reset script to completely clean and reinitialize the database
WARNING: This will delete all existing data!
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Database configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "knowledge_management")

async def reset_database():
    """Reset database by dropping all collections and recreating them"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print(f"⚠️  RESETTING DATABASE: {DATABASE_NAME}")
    print("⚠️  This will delete ALL existing data!")
    
    # Ask for confirmation
    confirmation = input("Are you sure you want to continue? (yes/no): ")
    if confirmation.lower() != 'yes':
        print("❌ Reset cancelled")
        return
    
    try:
        # Drop all collections
        collections = await db.list_collection_names()
        for collection_name in collections:
            await db.drop_collection(collection_name)
            print(f"🗑️ Dropped collection: {collection_name}")
        
        print("✅ Database reset completed!")
        print("💡 Run 'python scripts/init_database.py' to recreate collections and indexes")
        print("💡 Run 'python scripts/seed_data.py' to populate with test data")
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(reset_database())
