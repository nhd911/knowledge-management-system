from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import Optional
import tempfile
import os

from database import get_database
from models import User
from auth import get_current_user
from services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/analyze-file")
async def analyze_file(
    file: UploadFile = File(...),
    title: str = "",
    current_user: User = Depends(get_current_user)
):
    """Analyze uploaded file and generate summary and tags"""
    
    # Validate file type
    allowed_extensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif']
    file_extension = file.filename.split('.')[-1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not supported for AI analysis"
        )

    try:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Determine file type for processing
        if file_extension == 'pdf':
            file_type = 'pdf'
        elif file_extension in ['doc', 'docx']:
            file_type = 'docx'
        elif file_extension in ['png', 'jpg', 'jpeg', 'gif']:
            file_type = 'image'
        else:
            file_type = 'unknown'

        # Analyze file with AI
        analysis_result = await AIService.enhance_document_metadata(
            temp_file_path, file_type, title
        )

        # Clean up temporary file
        os.unlink(temp_file_path)

        return {
            "summary": analysis_result["summary"],
            "tags": analysis_result["tags"],
            "extracted_text_preview": analysis_result["extracted_text"][:500] + "..." if len(analysis_result["extracted_text"]) > 500 else analysis_result["extracted_text"],
            "has_content": bool(analysis_result["extracted_text"])
        }

    except Exception as e:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )

@router.post("/generate-summary")
async def generate_summary(
    text: str,
    max_words: int = 500,
    current_user: User = Depends(get_current_user)
):
    """Generate summary from provided text"""
    
    if not text or len(text.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text is too short for summary generation"
        )

    try:
        summary = await AIService.generate_summary(text, max_words)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summary generation failed: {str(e)}"
        )

@router.post("/generate-tags")
async def generate_tags(
    text: str,
    title: str = "",
    current_user: User = Depends(get_current_user)
):
    """Generate tags from provided text"""
    
    if not text or len(text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text is too short for tag generation"
        )

    try:
        tags = await AIService.generate_tags(text, title)
        return {"tags": tags}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tag generation failed: {str(e)}"
        )
