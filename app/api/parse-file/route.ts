import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (fileName.endsWith(".pdf")) {
      return await parsePDF(buffer, file.name);
    }

    if (fileName.endsWith(".docx")) {
      return await parseDOCX(buffer, file.name);
    }

    return NextResponse.json(
      { error: "Unsupported file type. Supported: .pdf, .docx" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[/api/parse-file]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function parsePDF(buffer: Buffer, fileName: string) {
  const parserUrl = process.env.PDF_PARSER_URL;
  if (!parserUrl) {
    return NextResponse.json(
      { error: "PDF_PARSER_URL not configured. Start the Python PDF parser service." },
      { status: 500 }
    );
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "application/pdf" }), fileName);

  const res = await fetch(`${parserUrl}/parse`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    return NextResponse.json(
      { error: `PDF parser error: ${errData.detail || res.statusText}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json({
    text: data.text,
    fileType: "pdf",
    fileName,
    pages: data.pages,
  });
}

async function parseDOCX(buffer: Buffer, fileName: string) {
  const result = await mammoth.extractRawText({ buffer });
  return NextResponse.json({
    text: result.value,
    fileType: "docx",
    fileName,
  });
}
