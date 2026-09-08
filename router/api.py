from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi import UploadFile, File, HTTPException
from pathlib import Path
from uuid import uuid4
from core.utilits import normalize_persian,create_persian_splitter,create_embedding,bulid_promp,OllamaChat,ChromaDB,text_extractor,text_extractor_pdf
from config import EMB_MODEL,CHROMA_DB_PATH

router = APIRouter(prefix="/api")


@router.get("/chat")
async def chat(request: Request):
    return NotImplemented

@router.post("/api/files")
async def add_file(request: Request,
    file: UploadFile = File(...)
):
    content = await file.read()
    filename = str(file.filename)
    exp = filename.split(".")[1].lower()
    text = ""
    if exp == "pdf":
        text = text_extractor_pdf(content)
    elif exp == "txt":
        text = text_extractor(content)
    # پردازش مستقیم محتوا


    text = normalize_persian(text)

    chunks = create_persian_splitter().split_text(text)
    db = ChromaDB(CHROMA_DB_PATH)
    db.connect()
    for i in chunks:
        embedding = create_embedding(i,EMB_MODEL)
        db.add_embedding(embedding)
        
    return {
        "file_name": file.filename,
        "chunks": len(chunks),
        "status": "processed"
    }