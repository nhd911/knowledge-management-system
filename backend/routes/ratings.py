from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from datetime import datetime

from database import get_database
from models import Rating, RatingCreate, User
from auth import get_current_user

router = APIRouter(prefix="/ratings", tags=["ratings"])

@router.post("/documents/{document_id}")
async def rate_document(
    document_id: str,
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user)
):
    """Rate a document"""
    db = await get_database()
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    
    # Check if document exists and user has access
    document = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Check permissions
    if (document["visibility"] == "private" and document["owner_id"] != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Check if user already rated this document
    existing_rating = await db.ratings.find_one({
        "document_id": ObjectId(document_id),
        "user_id": current_user.id
    })
    
    if existing_rating:
        # Update existing rating
        old_rating = existing_rating["rating"]
        await db.ratings.update_one(
            {"_id": existing_rating["_id"]},
            {"$set": {"rating": rating_data.rating, "created_at": datetime.utcnow()}}
        )
        
        # Update document rating statistics
        new_rating_sum = document["rating_sum"] - old_rating + rating_data.rating
        new_average = new_rating_sum / document["rating_count"] if document["rating_count"] > 0 else 0
        
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"rating_sum": new_rating_sum, "average_rating": new_average}}
        )
        
        return {"message": "Rating updated successfully", "rating": rating_data.rating}
    else:
        # Create new rating
        rating_doc = {
            "document_id": ObjectId(document_id),
            "user_id": current_user.id,
            "rating": rating_data.rating,
            "created_at": datetime.utcnow()
        }
        
        await db.ratings.insert_one(rating_doc)
        
        # Update document rating statistics
        new_rating_sum = document["rating_sum"] + rating_data.rating
        new_rating_count = document["rating_count"] + 1
        new_average = new_rating_sum / new_rating_count
        
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {
                "rating_sum": new_rating_sum,
                "rating_count": new_rating_count,
                "average_rating": new_average
            }}
        )
        
        return {"message": "Rating added successfully", "rating": rating_data.rating}

@router.get("/documents/{document_id}/my-rating")
async def get_my_rating(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get current user's rating for a document"""
    db = await get_database()
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    
    rating = await db.ratings.find_one({
        "document_id": ObjectId(document_id),
        "user_id": current_user.id
    })
    
    if rating:
        return {"rating": rating["rating"], "created_at": rating["created_at"]}
    else:
        return {"rating": None}

@router.delete("/documents/{document_id}")
async def remove_rating(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove user's rating from a document"""
    db = await get_database()
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    
    # Find existing rating
    existing_rating = await db.ratings.find_one({
        "document_id": ObjectId(document_id),
        "user_id": current_user.id
    })
    
    if not existing_rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
    
    # Remove rating
    await db.ratings.delete_one({"_id": existing_rating["_id"]})
    
    # Update document rating statistics
    document = await db.documents.find_one({"_id": ObjectId(document_id)})
    if document:
        new_rating_sum = document["rating_sum"] - existing_rating["rating"]
        new_rating_count = max(0, document["rating_count"] - 1)
        new_average = new_rating_sum / new_rating_count if new_rating_count > 0 else 0
        
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {
                "rating_sum": new_rating_sum,
                "rating_count": new_rating_count,
                "average_rating": new_average
            }}
        )
    
    return {"message": "Rating removed successfully"}
