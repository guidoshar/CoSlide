"use client";

import { useEffect, useState, useRef } from "react";

export type StreamStage =
  | "connecting"
  | "streaming"
  | "parsing"
  | "rendering-pptx"
  | "summarizing"
  | "done";

interface TerminalStatusProps {
  stage: StreamStage;
  streamedContent: string;
  tokenCount: number;
  totalSlides?: number;
  currentSlide?: number;
  startTime: number;
}

const STAGES_ORDER: StreamStage[] = [
  "connecting",
  "streaming",
  "parsing",
  "rendering-pptx",
  "summarizing",
  "done",
];

const STAGE_LABELS: Record<StreamStage, string> = {
  connecting: "CONNECTING",
  streaming: "AI GENERATING",
  parsing: "PARSING JSON",
  "rendering-pptx": "RENDERING",
  summarizing: "SUMMARIZING",
  done: "COMPLETE",
};

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
}

export default function TerminalStatus({
  stage,
  streamedContent,
  tokenCount,
  totalSlides = 0,
  currentSlide = 0,
  startTime,
}: TerminalStatusProps) {
  const [elapsed, setElapsed] = useState(0);
  const contentRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 200);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamedContent]);

  const currentIdx = STAGES_ORDER.indexOf(stage);

  let progressPercent = 5;
  if (stage === "streaming") progressPercent = Math.min(75, 15 + tokenCount * 0.12);
  else if (stage === "parsing") progressPercent = 80;
  else if (stage === "rendering-pptx") progressPercent = totalSlides > 0 ? 85 + (currentSlide / totalSlides) * 10 : 88;
  else if (stage === "summarizing") progressPercent = 96;
  else if (stage === "done") progressPercent = 100;

  return (
    <div className="border-4 border-black bg-[#F4F1EA] overflow-hidden">
      {/* Header bar */}
      <div className="bg-black text-[#F4F1EA] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
            PROCESS LOG
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] opacity-40">
            [ NO. {String(Date.now()).slice(-6)} ]
          </span>
        </div>
        <div className="flex items-center gap-4">
          {tokenCount > 0 && (
            <span className="font-mono text-[10px] tracking-wider opacity-60 tabular-nums">
              {tokenCount} TKN
            </span>
          )}
          <span className="font-mono text-xs tracking-wider tabular-nums">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>

      {/* Stage pipeline */}
      <div className="px-4 py-3 border-b-2 border-dashed border-black/20">
        <div className="flex items-center gap-1 flex-wrap">
          {STAGES_ORDER.slice(0, -1).map((s, i) => {
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`
                    px-2 py-1 font-mono text-[8px] uppercase tracking-widest border-2 transition-all
                    ${isDone ? "bg-black text-[#F4F1EA] border-black" : ""}
                    ${isActive ? "bg-black text-[#F4F1EA] border-black" : ""}
                    ${!isDone && !isActive ? "bg-[#F4F1EA] text-black/25 border-black/15" : ""}
                  `}
                >
                  {isDone ? "✓" : isActive ? "●" : "○"} {STAGE_LABELS[s]}
                </div>
                {i < STAGES_ORDER.length - 2 && (
                  <span className={`font-mono text-[10px] ${isDone ? "text-black" : "text-black/15"}`}>
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 my-3">
        <div className="h-3 bg-white border-2 border-black">
          <div
            className="h-full bg-black transition-all duration-500 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            {stage !== "done" && (
              <div className="absolute right-0 top-0 h-full w-1.5 bg-[#F4F1EA] animate-pulse" />
            )}
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">
            {STAGE_LABELS[stage]}
          </span>
          <span className="font-mono text-[9px] tracking-wider tabular-nums opacity-40">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Streaming content */}
      {streamedContent && (
        <div className="mx-4 mb-3">
          <div className="border-2 border-black bg-white">
            <div className="border-b border-dashed border-black/20 px-3 py-1 flex items-center gap-2">
              <div className="polka-dot w-3 h-3 opacity-20" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-40">
                MODEL OUTPUT STREAM
              </span>
            </div>
            <pre
              ref={contentRef}
              className="px-3 py-2 font-mono text-[11px] leading-relaxed text-black/70 max-h-52 overflow-y-auto whitespace-pre-wrap break-all"
            >
              {streamedContent}
              {stage === "streaming" && (
                <span className="cursor-blink text-black">█</span>
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Slide rendering log */}
      {stage === "rendering-pptx" && totalSlides > 0 && (
        <div className="mx-4 mb-3 border-2 border-black bg-white px-3 py-2 space-y-0.5">
          {Array.from({ length: currentSlide }, (_, i) => (
            <p key={i} className="font-mono text-[10px]">
              <span className="text-black font-bold">[OK]</span>{" "}
              <span className="opacity-60">SLIDE {i + 1}/{totalSlides} RENDERED</span>
            </p>
          ))}
          {currentSlide < totalSlides && (
            <p className="font-mono text-[10px] flex items-center">
              <span className="text-black font-bold">[..]</span>{" "}
              <span className="opacity-60">RENDERING SLIDE {currentSlide + 1}/{totalSlides}</span>
              <span className="cursor-blink ml-1">█</span>
            </p>
          )}
        </div>
      )}

      {/* Connecting state */}
      {stage === "connecting" && !streamedContent && (
        <div className="mx-4 mb-3 border-2 border-black bg-white px-3 py-3">
          <p className="font-mono text-[10px] flex items-center">
            <span className="font-bold mr-2">{"> "}</span>
            <span className="opacity-60">INITIALIZING AI ENGINE</span>
            <span className="cursor-blink ml-1">█</span>
          </p>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t-2 border-dashed border-black/20 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {stage !== "done" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
            </span>
          )}
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-30">
            {stage === "streaming" ? "STREAM ACTIVE" : stage === "done" ? "PROCESS COMPLETE" : "PROCESSING"}
          </span>
        </div>
        <div className="barcode w-20 h-3 opacity-15" />
      </div>
    </div>
  );
}
