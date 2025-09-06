#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.append('backend')

from database import get_database

async def check_documents():
    try:
        db = await get_database()
        docs = await db.documents.find({}).to_list(length=10)
        print(f"Found {len(docs)} documents")
        for i, doc in enumerate(docs):
            print(f"\nDocument {i+1}:")
            print(f"  Title: {doc.get('title', 'N/A')}")
            print(f"  Summary: {doc.get('summary', 'N/A')}")
            print(f"  Summary length: {len(doc.get('summary', ''))}")
            print(f"  Tags: {doc.get('tags', [])}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_documents())
