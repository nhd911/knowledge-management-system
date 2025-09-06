import openai
import os
from typing import List, Optional
import PyPDF2
import docx
from PIL import Image
import pytesseract
import io
import re

# Configure OpenAI (you can also use other AI services)
openai.api_key = os.getenv("OPENAI_API_KEY", "your-openai-api-key-here")

class AIService:
    @staticmethod
    async def extract_text_from_file(file_path: str, file_type: str) -> str:
        """Extract text content from uploaded files"""
        try:
            if file_type == "pdf":
                return AIService._extract_text_from_pdf(file_path)
            elif file_type in ["doc", "docx"]:
                return AIService._extract_text_from_docx(file_path)
            elif file_type == "image":
                return AIService._extract_text_from_image(file_path)
            else:
                return ""
        except Exception as e:
            print(f"Error extracting text from {file_path}: {e}")
            return ""

    @staticmethod
    def _extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")
        return text.strip()

    @staticmethod
    def _extract_text_from_docx(file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error reading DOCX: {e}")
            return ""

    @staticmethod
    def _extract_text_from_image(file_path: str) -> str:
        """Extract text from image using OCR"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            print(f"Error performing OCR: {e}")
            return ""

    @staticmethod
    async def generate_summary(text: str, max_words: int = 500) -> str:
        """Generate AI summary of the document content"""
        if not text or len(text.strip()) < 50:
            return ""

        try:
            # Clean and truncate text if too long
            cleaned_text = re.sub(r'\s+', ' ', text.strip())
            if len(cleaned_text) > 4000:  # Limit input to avoid token limits
                cleaned_text = cleaned_text[:4000] + "..."

            prompt = f"""
            Please provide a concise summary of the following document content. 
            The summary should be informative, well-structured, and no more than {max_words} words.
            Focus on the key points, main topics, and important information.

            Document content:
            {cleaned_text}

            Summary:
            """

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates concise, informative summaries of documents."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.3
            )

            summary = response.choices[0].message.content.strip()
            
            # Ensure summary doesn't exceed word limit
            words = summary.split()
            if len(words) > max_words:
                summary = ' '.join(words[:max_words]) + "..."

            return summary

        except Exception as e:
            print(f"Error generating summary: {e}")
            return ""

    @staticmethod
    async def generate_tags(text: str, title: str = "") -> List[str]:
        """Generate relevant tags for the document"""
        if not text or len(text.strip()) < 20:
            return []

        try:
            # Clean and truncate text
            cleaned_text = re.sub(r'\s+', ' ', text.strip())
            if len(cleaned_text) > 3000:
                cleaned_text = cleaned_text[:3000] + "..."

            prompt = f"""
            Based on the following document title and content, generate 5-8 relevant tags that would help categorize and find this document.
            Tags should be:
            - Single words or short phrases (2-3 words max)
            - Relevant to the content and topic
            - Useful for search and categorization
            - Professional and descriptive

            Title: {title}
            
            Content:
            {cleaned_text}

            Please provide only the tags, separated by commas, without any additional text or explanation.
            """

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates relevant tags for document categorization."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.3
            )

            tags_text = response.choices[0].message.content.strip()
            
            # Parse and clean tags
            tags = [tag.strip().lower() for tag in tags_text.split(',') if tag.strip()]
            
            # Remove duplicates and limit to 8 tags
            unique_tags = []
            for tag in tags:
                if tag not in unique_tags and len(tag) > 1:
                    unique_tags.append(tag)
                if len(unique_tags) >= 8:
                    break

            return unique_tags

        except Exception as e:
            print(f"Error generating tags: {e}")
            return []

    @staticmethod
    async def enhance_document_metadata(file_path: str, file_type: str, title: str) -> dict:
        """Extract text and generate both summary and tags"""
        text = await AIService.extract_text_from_file(file_path, file_type)
        
        if not text:
            return {"summary": "", "tags": [], "extracted_text": ""}

        # Generate summary and tags concurrently
        summary = await AIService.generate_summary(text)
        tags = await AIService.generate_tags(text, title)

        return {
            "summary": summary,
            "tags": tags,
            "extracted_text": text[:1000] + "..." if len(text) > 1000 else text  # Store first 1000 chars for reference
        }
