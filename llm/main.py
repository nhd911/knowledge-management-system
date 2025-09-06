from fastapi import FastAPI, UploadFile, File, Form, APIRouter
from typing import List
import uvicorn
import tempfile
import os

from openai import OpenAI
from docx import Document

from method_llm import DocTagger, DocxSummarizer  # import your class

app = FastAPI(title="LLM API")
router = APIRouter(prefix="/llm_api")

doc_tagger = DocTagger()
doc_summarizer = DocxSummarizer()

@router.post("/summarize")
async def summarize_docx(file: UploadFile = File(...), max_words: int = Form(200)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    summary = doc_summarizer.summarize_docx(tmp_path, max_words=max_words)
    os.remove(tmp_path)
    return {"summary": summary}

@router.post("/classify")
async def classify_docx(file: UploadFile = File(...), tags: str = Form(...)):
    list_tags = [t.strip() for t in tags.split(",") if t.strip()]
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    result_tags = doc_tagger.classify_docx(tmp_path, list_tags)
    os.remove(tmp_path)
    return {"tags": result_tags}
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7777)
