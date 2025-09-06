from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Optional, List
import os
import uuid
from datetime import datetime
import aiofiles
from bson import ObjectId

from database import get_database
from models import Document, DocumentCreate, DocumentResponse, User, VisibilityLevel, DocumentType
from auth import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {
    'pdf': DocumentType.PDF,
    'doc': DocumentType.DOC,
    'docx': DocumentType.DOCX,
    'png': DocumentType.IMAGE,
    'jpg': DocumentType.IMAGE,
    'jpeg': DocumentType.IMAGE,
    'gif': DocumentType.IMAGE
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

async def save_uploaded_file(file: UploadFile) -> tuple[str, DocumentType, int]:
    """Save uploaded file and return file path, type, and size"""
    # Validate file extension
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS.keys())}"
        )
    
    # Read file content to check size
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.{file_extension}"
    file_path = os.path.join("uploads", filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    return file_path, ALLOWED_EXTENSIONS[file_extension], file_size

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    title: str = Form(...),
    summary: Optional[str] = Form(None),
    tags: str = Form(""),
    visibility: VisibilityLevel = Form(VisibilityLevel.PRIVATE),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a new document"""
    db = await get_database()
    
    # Save uploaded file
    file_path, file_type, file_size = await save_uploaded_file(file)
    
    # Parse tags
    tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()] if tags else []
    
    # Create document
    document_data = {
        "title": title,
        "summary": summary,
        "tags": tag_list,
        "visibility": visibility,
        "owner_id": current_user.id,
        "file_path": file_path,
        "file_type": file_type,
        "file_size": file_size,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "rating_sum": 0,
        "rating_count": 0,
        "average_rating": 0.0
    }
    
    result = await db.documents.insert_one(document_data)
    created_document = await db.documents.find_one({"_id": result.inserted_id})
    
    # Get owner information
    owner = await db.users.find_one({"_id": current_user.id})
    
    return DocumentResponse(
        id=str(created_document["_id"]),
        title=created_document["title"],
        summary=created_document["summary"],
        tags=created_document["tags"],
        visibility=created_document["visibility"],
        owner_id=str(created_document["owner_id"]),
        owner_name=owner["full_name"],
        file_path=created_document["file_path"],
        file_type=created_document["file_type"],
        file_size=created_document["file_size"],
        created_at=created_document["created_at"],
        updated_at=created_document["updated_at"],
        average_rating=created_document["average_rating"],
        rating_count=created_document["rating_count"]
    )

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Get documents with pagination"""
    db = await get_database()
    
    skip = (page - 1) * limit
    
    # Build query based on user permissions
    query = {
        "$or": [
            {"visibility": VisibilityLevel.PUBLIC},
            {"owner_id": current_user.id},
            {
                "visibility": VisibilityLevel.GROUP,
                "$expr": {
                    "$and": [
                        {"$ne": [current_user.group, None]},
                        {"$ne": [current_user.group, ""]}
                    ]
                }
            }
        ]
    }
    
    documents = await db.documents.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(length=limit)
    
    # Get owner information for each document
    result = []
    for doc in documents:
        owner = await db.users.find_one({"_id": doc["owner_id"]})
        result.append(DocumentResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            summary=doc["summary"],
            tags=doc["tags"],
            visibility=doc["visibility"],
            owner_id=str(doc["owner_id"]),
            owner_name=owner["full_name"] if owner else "Unknown",
            file_path=doc["file_path"],
            file_type=doc["file_type"],
            file_size=doc["file_size"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            average_rating=doc["average_rating"],
            rating_count=doc["rating_count"]
        ))
    
    return result

@router.get("/latest", response_model=List[DocumentResponse])
async def get_latest_documents(
    limit: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Get latest documents"""
    db = await get_database()
    
    query = {
        "$or": [
            {"visibility": VisibilityLevel.PUBLIC},
            {"owner_id": current_user.id},
            {
                "visibility": VisibilityLevel.GROUP,
                "$expr": {
                    "$and": [
                        {"$ne": [current_user.group, None]},
                        {"$ne": [current_user.group, ""]}
                    ]
                }
            }
        ]
    }
    
    documents = await db.documents.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    result = []
    for doc in documents:
        owner = await db.users.find_one({"_id": doc["owner_id"]})
        result.append(DocumentResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            summary=doc["summary"],
            tags=doc["tags"],
            visibility=doc["visibility"],
            owner_id=str(doc["owner_id"]),
            owner_name=owner["full_name"] if owner else "Unknown",
            file_path=doc["file_path"],
            file_type=doc["file_type"],
            file_size=doc["file_size"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            average_rating=doc["average_rating"],
            rating_count=doc["rating_count"]
        ))
    
    return result

@router.get("/popular", response_model=List[DocumentResponse])
async def get_popular_documents(
    limit: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Get most popular documents by rating"""
    db = await get_database()
    
    query = {
        "$or": [
            {"visibility": VisibilityLevel.PUBLIC},
            {"owner_id": current_user.id},
            {
                "visibility": VisibilityLevel.GROUP,
                "$expr": {
                    "$and": [
                        {"$ne": [current_user.group, None]},
                        {"$ne": [current_user.group, ""]}
                    ]
                }
            }
        ]
    }
    
    documents = await db.documents.find(query).sort("average_rating", -1).limit(limit).to_list(length=limit)
    
    result = []
    for doc in documents:
        owner = await db.users.find_one({"_id": doc["owner_id"]})
        result.append(DocumentResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            summary=doc["summary"],
            tags=doc["tags"],
            visibility=doc["visibility"],
            owner_id=str(doc["owner_id"]),
            owner_name=owner["full_name"] if owner else "Unknown",
            file_path=doc["file_path"],
            file_type=doc["file_type"],
            file_size=doc["file_size"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            average_rating=doc["average_rating"],
            rating_count=doc["rating_count"]
        ))
    
    return result

@router.get("/my", response_model=List[DocumentResponse])
async def get_my_documents(
    limit: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Get current user's documents"""
    db = await get_database()
    
    documents = await db.documents.find({"owner_id": current_user.id}).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    result = []
    for doc in documents:
        result.append(DocumentResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            summary=doc["summary"],
            tags=doc["tags"],
            visibility=doc["visibility"],
            owner_id=str(doc["owner_id"]),
            owner_name=current_user.full_name,
            file_path=doc["file_path"],
            file_type=doc["file_type"],
            file_size=doc["file_size"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            average_rating=doc["average_rating"],
            rating_count=doc["rating_count"]
        ))
    
    return result

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific document"""
    db = await get_database()
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    
    document = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Check permissions
    if (document["visibility"] == VisibilityLevel.PRIVATE and 
        document["owner_id"] != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if (document["visibility"] == VisibilityLevel.GROUP and 
        document["owner_id"] != current_user.id and
        (not current_user.group or current_user.group != document.get("group"))):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    owner = await db.users.find_one({"_id": document["owner_id"]})
    
    return DocumentResponse(
        id=str(document["_id"]),
        title=document["title"],
        summary=document["summary"],
        tags=document["tags"],
        visibility=document["visibility"],
        owner_id=str(document["owner_id"]),
        owner_name=owner["full_name"] if owner else "Unknown",
        file_path=document["file_path"],
        file_type=document["file_type"],
        file_size=document["file_size"],
        created_at=document["created_at"],
        updated_at=document["updated_at"],
        average_rating=document["average_rating"],
        rating_count=document["rating_count"]
    )

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    title: Optional[str] = Form(None),
    summary: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    visibility: Optional[VisibilityLevel] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Update a document"""
    db = await get_database()
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    
    document = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Check ownership
    if document["owner_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only document owner can update")
    
    # Build update data
    update_data = {"updated_at": datetime.utcnow()}
    if title is not None:
        update_data["title"] = title
    if summary is not None:
        update_data["summary"] = summary
    if tags is not None:
        update_data["tags"] = [tag.strip() for tag in tags.split(',') if tag.strip()]
    if visibility is not None:
        update_data["visibility"] = visibility
    
    await db.documents.update_one({"_id": ObjectId(document_id)}, {"$set": update_data})
    
    updated_document = await db.documents.find_one({"_id": ObjectId(document_id)})
    
    return DocumentResponse(
        id=str(updated_document["_id"]),
        title=updated_document["title"],
        summary=updated_document["summary"],
        tags=updated_document["tags"],
        visibility=updated_document["visibility"],
        owner_id=str(updated_document["owner_id"]),
        owner_name=current_user.full_name,
        file_path=updated_document["file_path"],
        file_type=updated_document["file_type"],
        file_size=updated_document["file_size"],
        created_at=updated_document["created_at"],
        updated_at=updated_document["updated_at"],
        average_rating=updated_document["average_rating"],
        rating_count=updated_document["rating_count"]
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a document"""
    db = await get_database()
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    
    document = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Check ownership
    if document["owner_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only document owner can delete")
    
    # Delete file
    if document["file_path"] and os.path.exists(document["file_path"]):
        os.remove(document["file_path"])
    
    # Delete document from database
    await db.documents.delete_one({"_id": ObjectId(document_id)})
    
    return {"message": "Document deleted successfully"}

@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download a document file"""
    db = await get_database()
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document ID")
    
    document = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Check permissions
    if (document["visibility"] == VisibilityLevel.PRIVATE and 
        document["owner_id"] != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if not document["file_path"] or not os.path.exists(document["file_path"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    return FileResponse(
        path=document["file_path"],
        filename=f"{document['title']}.{document['file_path'].split('.')[-1]}",
        media_type='application/octet-stream'
    )

@router.get("/search", response_model=List[DocumentResponse])
async def search_documents(
    query: Optional[str] = None,
    tags: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    group: Optional[str] = None,
    visibility: Optional[VisibilityLevel] = None,
    owner: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Search documents with advanced filtering"""
    db = await get_database()
    
    # Build base permission query
    base_query = {
        "$or": [
            {"visibility": VisibilityLevel.PUBLIC},
            {"owner_id": current_user.id},
            {
                "visibility": VisibilityLevel.GROUP,
                "$expr": {
                    "$and": [
                        {"$ne": [current_user.group, None]},
                        {"$ne": [current_user.group, ""]}
                    ]
                }
            }
        ]
    }
    
    # Build search filters
    search_filters = []
    
    # Text search in title and summary
    if query:
        search_filters.append({
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"summary": {"$regex": query, "$options": "i"}}
            ]
        })
    
    # Tags filter
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        if tag_list:
            search_filters.append({"tags": {"$in": tag_list}})
    
    # Date range filter
    if date_from or date_to:
        date_filter = {}
        if date_from:
            try:
                date_filter["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_from format")
        if date_to:
            try:
                date_filter["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_to format")
        search_filters.append({"created_at": date_filter})
    
    # Group filter
    if group:
        search_filters.append({"group": group})
    
    # Visibility filter
    if visibility:
        search_filters.append({"visibility": visibility})
    
    # Owner filter
    if owner:
        # Find user by username or full name
        owner_user = await db.users.find_one({
            "$or": [
                {"username": {"$regex": owner, "$options": "i"}},
                {"full_name": {"$regex": owner, "$options": "i"}}
            ]
        })
        if owner_user:
            search_filters.append({"owner_id": owner_user["_id"]})
        else:
            # No matching owner found, return empty results
            return []
    
    # Combine base query with search filters
    if search_filters:
        final_query = {"$and": [base_query] + search_filters}
    else:
        final_query = base_query
    
    # Sorting
    sort_direction = -1 if sort_order == "desc" else 1
    sort_field = sort_by if sort_by in ["created_at", "updated_at", "title", "average_rating"] else "created_at"
    
    # Pagination
    skip = (page - 1) * limit
    
    # Execute query
    documents = await db.documents.find(final_query).sort(sort_field, sort_direction).skip(skip).limit(limit).to_list(length=limit)
    
    # Get owner information for each document
    result = []
    for doc in documents:
        owner = await db.users.find_one({"_id": doc["owner_id"]})
        result.append(DocumentResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            summary=doc["summary"],
            tags=doc["tags"],
            visibility=doc["visibility"],
            owner_id=str(doc["owner_id"]),
            owner_name=owner["full_name"] if owner else "Unknown",
            file_path=doc["file_path"],
            file_type=doc["file_type"],
            file_size=doc["file_size"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            average_rating=doc["average_rating"],
            rating_count=doc["rating_count"]
        ))
    
    return result

@router.get("/search/count")
async def get_search_count(
    query: Optional[str] = None,
    tags: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    group: Optional[str] = None,
    visibility: Optional[VisibilityLevel] = None,
    owner: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get total count of search results"""
    db = await get_database()
    
    # Build base permission query
    base_query = {
        "$or": [
            {"visibility": VisibilityLevel.PUBLIC},
            {"owner_id": current_user.id},
            {
                "visibility": VisibilityLevel.GROUP,
                "$expr": {
                    "$and": [
                        {"$ne": [current_user.group, None]},
                        {"$ne": [current_user.group, ""]}
                    ]
                }
            }
        ]
    }
    
    # Build search filters (same logic as search endpoint)
    search_filters = []
    
    if query:
        search_filters.append({
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"summary": {"$regex": query, "$options": "i"}}
            ]
        })
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        if tag_list:
            search_filters.append({"tags": {"$in": tag_list}})
    
    if date_from or date_to:
        date_filter = {}
        if date_from:
            try:
                date_filter["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_from format")
        if date_to:
            try:
                date_filter["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_to format")
        search_filters.append({"created_at": date_filter})
    
    if group:
        search_filters.append({"group": group})
    
    if visibility:
        search_filters.append({"visibility": visibility})
    
    if owner:
        owner_user = await db.users.find_one({
            "$or": [
                {"username": {"$regex": owner, "$options": "i"}},
                {"full_name": {"$regex": owner, "$options": "i"}}
            ]
        })
        if owner_user:
            search_filters.append({"owner_id": owner_user["_id"]})
        else:
            return {"total": 0}
    
    # Combine base query with search filters
    if search_filters:
        final_query = {"$and": [base_query] + search_filters}
    else:
        final_query = base_query
    
    total = await db.documents.count_documents(final_query)
    return {"total": total}

@router.get("/tags")
async def get_all_tags(current_user: User = Depends(get_current_user)):
    """Get all unique tags from accessible documents"""
    db = await get_database()
    
    # Build base permission query
    base_query = {
        "$or": [
            {"visibility": VisibilityLevel.PUBLIC},
            {"owner_id": current_user.id},
            {
                "visibility": VisibilityLevel.GROUP,
                "$expr": {
                    "$and": [
                        {"$ne": [current_user.group, None]},
                        {"$ne": [current_user.group, ""]}
                    ]
                }
            }
        ]
    }
    
    # Aggregate to get unique tags
    pipeline = [
        {"$match": base_query},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 50}  # Limit to top 50 tags
    ]
    
    result = await db.documents.aggregate(pipeline).to_list(length=50)
    tags = [{"tag": item["_id"], "count": item["count"]} for item in result]
    
    return {"tags": tags}
