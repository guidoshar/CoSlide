"""PDF text extraction microservice using pdfplumber."""

import io
import logging

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CoSlide PDF Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@app.post("/parse")
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    try:
        pages_text: list[str] = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                pages_text.append(text)

        full_text = "\n\n".join(
            f"--- Page {i + 1} ---\n{t}" for i, t in enumerate(pages_text) if t.strip()
        )

        logger.info(
            "Parsed %s: %d pages, %d chars extracted",
            file.filename, len(pages_text), len(full_text),
        )

        return {
            "text": full_text,
            "pages": len(pages_text),
            "fileName": file.filename,
        }
    except Exception as e:
        logger.exception("Failed to parse PDF: %s", file.filename)
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok"}
