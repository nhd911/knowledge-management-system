from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class VisibilityLevel(str, Enum):
    PRIVATE = "private"
    GROUP = "group"
    PUBLIC = "public"

class DocumentType(str, Enum):
    PDF = "pdf"
    DOC = "doc"
    DOCX = "docx"
    IMAGE = "image"

# User Models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    department: Optional[str] = None
    group: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    department: Optional[str]
    group: Optional[str]
    created_at: datetime

# Document Models
class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    summary: Optional[str] = Field(None, max_length=500)
    tags: List[str] = Field(default_factory=list)
    visibility: VisibilityLevel = VisibilityLevel.PRIVATE

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    owner_id: PyObjectId
    file_path: Optional[str] = None
    file_type: Optional[DocumentType] = None
    file_size: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    rating_sum: int = 0
    rating_count: int = 0
    average_rating: float = 0.0

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DocumentResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str]
    tags: List[str]
    visibility: VisibilityLevel
    owner_id: str
    owner_name: str
    file_path: Optional[str]
    file_type: Optional[DocumentType]
    file_size: Optional[int]
    created_at: datetime
    updated_at: datetime
    average_rating: float
    rating_count: int

# Rating Model
class Rating(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    document_id: PyObjectId
    user_id: PyObjectId
    rating: int = Field(..., ge=1, le=5)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class RatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)

# Search Models
class SearchFilters(BaseModel):
    query: Optional[str] = None
    tags: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    group: Optional[str] = None
    visibility: Optional[VisibilityLevel] = None
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
