"use client";

import { useEffect, useState } from "react";

interface TerminalStatusProps {
  phase: "generating-json" | "rendering-pptx";
  totalSlides?: number;
  currentSlide?: number;
}

const JSON_LINES = [
  "> INITIALIZING AI ENGINE...",
  "> CONNECTING TO AZURE OPENAI ENDPOINT...",
  "> TRANSMITTING PROMPT DATA...",
  "> AWAITING LLM RESPONSE...",
  "> COMPILING JSON SCHEMA...",
  "> VALIDATING SLIDE STRUCTURE...",
];

export default function TerminalStatus({
  phase,
  totalSlides = 0,
  currentSlide = 0,
}: TerminalStatusProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    if (phase === "generating-json") {
      setVisibleLines([]);
      let i = 0;
      const interval = setInterval(() => {
        if (i < JSON_LINES.length) {
          setVisibleLines((prev) => [...prev, JSON_LINES[i]]);
          i++;
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="bg-black border-4 border-black p-6 font-mono text-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
        <div className="w-3 h-3 bg-green-500 rounded-full" />
        <span className="text-[#F4F1EA] text-xs ml-2 tracking-widest uppercase opacity-60">
          COSLIDE TERMINAL — PROCESS LOG
        </span>
      </div>

      <div className="text-green-400 space-y-1">
        {phase === "generating-json" && (
          <>
            {visibleLines.map((line, i) => (
              <p key={i} className="leading-relaxed">{line}</p>
            ))}
            <p className="flex items-center">
              <span className="cursor-blink mr-1">█</span>
              <span className="opacity-60">PROCESSING...</span>
            </p>
          </>
        )}

        {phase === "rendering-pptx" && (
          <>
            <p className="text-[#F4F1EA]">{"> "}JSON RECEIVED — {totalSlides} SLIDES DETECTED</p>
            <p>{"> "}INITIALIZING PPTXGENJS ENGINE...</p>
            {Array.from({ length: currentSlide }, (_, i) => (
              <p key={i} className="text-green-300">
                {"  "}[OK] SLIDE {i + 1}/{totalSlides} RENDERED
              </p>
            ))}
            {currentSlide < totalSlides && (
              <p className="flex items-center">
                {"  "}[..] RENDERING SLIDE {currentSlide + 1}/{totalSlides}
                <span className="cursor-blink ml-1">█</span>
              </p>
            )}
            {currentSlide >= totalSlides && totalSlides > 0 && (
              <>
                <p className="text-[#F4F1EA] mt-2">{"> "}ALL SLIDES COMPILED SUCCESSFULLY</p>
                <p className="text-yellow-400">{"> "}TRIGGERING DOWNLOAD...</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
