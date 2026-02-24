"use client";

import { useEffect, useState } from "react";
import type { Presentation, LogoConfig } from "@/lib/types";
import type { OutputFormat, StyleColors } from "@/lib/presets";
import { getStyleById } from "@/lib/presets";
import SlidePreview from "./SlidePreview";
import { downloadBlob, generatePPTX } from "@/lib/generate-pptx";
import { downloadHTML } from "@/lib/generate-html";

interface CompletionPanelProps {
  presentation: Presentation;
  pptxBlob: Blob | null;
  summary: string | null;
  summaryLoading: boolean;
  outputFormat: OutputFormat;
  styleId: string;
  logoConfig?: LogoConfig;
  colorOverrides?: Partial<StyleColors>;
  onContinueEditing: () => void;
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="cursor-blink">|</span>}
    </span>
  );
}

const TIMELINE_STEPS = [
  { label: "PROMPT SUBMITTED", icon: "▸" },
  { label: "JSON COMPILED", icon: "▸" },
  { label: "SLIDES RENDERED", icon: "▸" },
  { label: "ASSEMBLED", icon: "▸" },
  { label: "COMPLETE", icon: "★" },
];

export default function CompletionPanel({
  presentation,
  pptxBlob,
  summary,
  summaryLoading,
  outputFormat,
  styleId,
  logoConfig,
  colorOverrides,
  onContinueEditing,
}: CompletionPanelProps) {
  const [generatingPptx, setGeneratingPptx] = useState(false);
  const fileName = presentation.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff\s\-_]/g, "").trim() || "presentation";
  const style = getStyleById(styleId, colorOverrides);

  async function handleDownloadPptx() {
    if (pptxBlob) {
      downloadBlob(pptxBlob, `${fileName}.pptx`);
      return;
    }
    setGeneratingPptx(true);
    try {
      const blob = await generatePPTX(presentation, styleId, undefined, logoConfig, colorOverrides);
      downloadBlob(blob, `${fileName}.pptx`);
    } finally {
      setGeneratingPptx(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Operation Timeline */}
      <div className="border-4 border-black bg-[#F4F1EA]">
        <div className="bg-black text-[#F4F1EA] px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase flex justify-between">
          <span>OPERATION LOG — MISSION ACCOMPLISHED</span>
          <span className="opacity-60">{style.nameEn}</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {TIMELINE_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-white border-2 border-black px-2 py-1">
                  <span className="font-mono text-[9px] font-bold" style={{ color: `#${style.colors.accent}` }}>{step.icon}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest">{step.label}</span>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <span className="font-mono text-[10px] text-black">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 border-t-2 border-dashed border-black pt-2 flex justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
              {presentation.slides.length} SLIDES | FORMAT: {outputFormat.toUpperCase()}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-50 truncate ml-4 max-w-[50%]">
              {presentation.title}
            </span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="border-4 border-black bg-white">
        <div className="border-b-4 border-dashed border-black px-4 py-2 flex items-center gap-2">
          <div className="polka-dot w-4 h-4 opacity-30" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
            AI ASSISTANT MESSAGE
          </span>
        </div>
        <div className="p-5">
          {summaryLoading ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm cursor-blink" style={{ color: `#${style.colors.accent}` }}>●</span>
              <span className="font-mono text-sm text-[#999]">CoSlide 正在整理总结...</span>
            </div>
          ) : summary ? (
            <p className="text-sm leading-relaxed text-[#333]">
              <TypewriterText text={summary} />
            </p>
          ) : (
            <p className="text-sm text-[#999] italic">总结生成失败，但你的演示文稿已经准备好啦~</p>
          )}
        </div>
      </div>

      {/* Slide Preview */}
      <SlidePreview presentation={presentation} styleId={styleId} logoConfig={logoConfig} colorOverrides={colorOverrides} />

      {/* Download Center */}
      <div className="border-4 border-black bg-[#F4F1EA]">
        <div className="border-b-4 border-dashed border-black px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
            DOWNLOAD CENTER
          </span>
        </div>
        <div className="p-4 flex flex-col md:flex-row gap-3">
          <button
            onClick={handleDownloadPptx}
            disabled={generatingPptx}
            className="
              flex-1 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em]
              bg-black text-[#F4F1EA] border-4 border-black
              hover:bg-[#F4F1EA] hover:text-black
              disabled:opacity-50 disabled:cursor-wait
              transition-colors duration-150 cursor-pointer
            "
          >
            {generatingPptx ? "[ RENDERING... ]" : "[ DOWNLOAD PPTX ]"}
          </button>
          <button
            onClick={() => downloadHTML(presentation, styleId, logoConfig, colorOverrides)}
            className="
              flex-1 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em]
              bg-white text-black border-4 border-black
              hover:bg-black hover:text-[#F4F1EA]
              transition-colors duration-150 cursor-pointer
            "
          >
            [ DOWNLOAD HTML ]
          </button>
        </div>
      </div>

      {/* Continue Editing */}
      <div className="border-4 border-black bg-white">
        <div className="border-b-4 border-dashed border-black px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
            CONTINUE SESSION
          </span>
        </div>
        <div className="p-4">
          <button
            onClick={onContinueEditing}
            className="
              w-full py-3 font-mono text-sm font-bold uppercase tracking-[0.2em]
              bg-[#F4F1EA] text-black border-4 border-black
              hover:bg-black hover:text-[#F4F1EA]
              transition-colors duration-150 cursor-pointer
            "
          >
            [ MODIFY &amp; REGENERATE ]
          </button>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mt-2">
            RETURN TO PROMPT — TEXT &amp; CONFIG PRESERVED
          </p>
        </div>
      </div>

      {/* Footer barcode */}
      <div className="border-t-4 border-dashed border-black pt-3 flex justify-between items-center">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-30">
          RECEIPT NO. 2026-BP-{String(presentation.slides.length).padStart(3, "0")}
        </span>
        <div className="barcode w-32 h-5 opacity-30" />
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-30">
          SESSION COMPLETE
        </span>
      </div>
    </div>
  );
}
