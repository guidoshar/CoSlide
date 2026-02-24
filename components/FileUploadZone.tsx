"use client";

import { useRef, useState, useCallback } from "react";
import type { AttachedFile } from "@/lib/types";

const ACCEPTED = ".pdf,.docx,.png,.jpg,.jpeg,.gif,.webp";
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

interface FileUploadZoneProps {
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
}

function getFileExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function fileTypeIcon(f: AttachedFile): string {
  if (f.fileType === "pdf") return "📄";
  if (f.fileType === "docx") return "📝";
  return "🖼️";
}

export default function FileUploadZone({ files, onFilesChange }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    const ext = getFileExt(file.name);
    const isImage = IMAGE_EXTS.has(ext);
    const fileType = ext === "pdf" ? "pdf" : ext === "docx" ? "docx" : isImage ? "image" : null;

    if (!fileType) return;
    if (file.size > MAX_FILE_SIZE) {
      alert(`文件 ${file.name} 超过 20MB 限制`);
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: AttachedFile = {
      id,
      fileName: file.name,
      fileType: fileType as AttachedFile["fileType"],
      content: "",
      status: "parsing",
    };

    const withNew = [...files, entry];
    onFilesChange(withNew);

    try {
      let content: string;
      if (isImage) {
        content = await readAsBase64(file);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-file", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        content = data.text;
      }
      onFilesChange(
        withNew.map((f) => f.id === id ? { ...f, content, status: "ready" as const } : f)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "解析失败";
      onFilesChange(
        withNew.map((f) => f.id === id ? { ...f, status: "error" as const, error: msg } : f)
      );
    }
  }, [files, onFilesChange]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(processFile);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    selected.forEach(processFile);
    e.target.value = "";
  }

  function removeFile(id: string) {
    onFilesChange(files.filter((f) => f.id !== id));
  }

  return (
    <div className="border-4 border-black bg-[#F4F1EA]">
      <div className="bg-black text-[#F4F1EA] px-4 py-2 font-mono text-[10px] tracking-[0.3em] uppercase flex justify-between">
        <span>MULTIMODAL INPUT — ATTACHMENTS</span>
        <span className="opacity-60">{files.length} FILE{files.length !== 1 ? "S" : ""}</span>
      </div>

      <div className="p-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed p-6 text-center cursor-pointer
            transition-colors duration-150
            ${dragOver
              ? "border-black bg-white"
              : "border-black/30 hover:border-black bg-white/50"
            }
          `}
        >
          <span className="font-mono text-xs uppercase tracking-widest opacity-50 block">
            拖拽文件到此处 或 点击上传
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest opacity-30 mt-1 block">
            PDF · DOCX · PNG · JPG · GIF · WEBP
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black/20"
              >
                <span className="text-sm">{fileTypeIcon(f)}</span>
                <span className="font-mono text-xs flex-1 truncate">{f.fileName}</span>

                {f.status === "parsing" && (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-black/40 cursor-blink">
                    PARSING...
                  </span>
                )}
                {f.status === "ready" && (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-green-700">
                    ✓ READY
                  </span>
                )}
                {f.status === "error" && (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-red-600" title={f.error}>
                    ✕ ERROR
                  </span>
                )}

                <button
                  onClick={() => removeFile(f.id)}
                  className="
                    font-mono text-xs text-black/30 hover:text-red-600
                    transition-colors cursor-pointer px-1
                  "
                  title="移除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
