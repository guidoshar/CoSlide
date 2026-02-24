"use client";

import { useState, useCallback, useEffect } from "react";
import TicketHeader from "./TicketHeader";
import TerminalStatus from "./TerminalStatus";
import CompletionPanel from "./CompletionPanel";
import ConfigPanel from "./ConfigPanel";
import TemplatePanel from "./TemplatePanel";
import FileUploadZone from "./FileUploadZone";
import { generatePPTX } from "@/lib/generate-pptx";
import type { Presentation, LogoPosition, LogoConfig, AttachedFile } from "@/lib/types";
import type { OutputFormat, StyleColors } from "@/lib/presets";
import { getStyleById } from "@/lib/presets";

type Phase = "idle" | "generating-json" | "rendering-pptx" | "summarizing" | "done" | "error";

interface WorkbenchProps {
  onLogout: () => void;
  userProfile?: string | null;
  onProfileUpdate?: (profile: string) => void;
  onProfileRegenerate?: () => void;
}

export default function Workbench({
  onLogout,
  userProfile,
  onProfileUpdate,
  onProfileRegenerate,
}: WorkbenchProps) {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [totalSlides, setTotalSlides] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pptx");
  const [styleId, setStyleId] = useState("executive");
  const [language, setLanguage] = useState("auto");

  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("top-right");
  const [colorOverrides, setColorOverrides] = useState<Partial<StyleColors>>({});

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const [presentationData, setPresentationData] = useState<Presentation | null>(null);
  const [pptxBlob, setPptxBlob] = useState<Blob | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem("coslide_logo");
      if (savedLogo) {
        const parsed = JSON.parse(savedLogo);
        setLogoData(parsed.data || null);
        setLogoPosition(parsed.position || "top-right");
      }
      const savedColors = localStorage.getItem("coslide_color_overrides");
      if (savedColors) setColorOverrides(JSON.parse(savedColors));
    } catch { /* ignore corrupt data */ }
  }, []);

  const handleLogoChange = useCallback((data: string | null) => {
    setLogoData(data);
    if (data) {
      localStorage.setItem("coslide_logo", JSON.stringify({ data, position: logoPosition }));
    } else {
      localStorage.removeItem("coslide_logo");
    }
  }, [logoPosition]);

  const handleLogoPositionChange = useCallback((pos: LogoPosition) => {
    setLogoPosition(pos);
    if (logoData) {
      localStorage.setItem("coslide_logo", JSON.stringify({ data: logoData, position: pos }));
    }
  }, [logoData]);

  const handleColorOverridesChange = useCallback((overrides: Partial<StyleColors>) => {
    setColorOverrides(overrides);
    if (Object.keys(overrides).length > 0) {
      localStorage.setItem("coslide_color_overrides", JSON.stringify(overrides));
    } else {
      localStorage.removeItem("coslide_color_overrides");
    }
  }, []);

  const logoConfig: LogoConfig | undefined = logoData
    ? { data: logoData, position: logoPosition }
    : undefined;

  const fetchSummary = useCallback(async (presentation: Presentation, userPrompt: string) => {
    setSummaryLoading(true);
    setAiSummary(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentation, userPrompt, userProfile: userProfile || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary || null);
      }
    } catch {
      // Non-critical
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setPhase("generating-json");
    setErrorMsg("");
    setPresentationData(null);
    setPptxBlob(null);
    setAiSummary(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: styleId,
          language,
          format: outputFormat,
          userProfile: userProfile || undefined,
          attachedFiles: attachedFiles
            .filter((f) => f.status === "ready")
            .map((f) => ({
              type: f.fileType === "image" ? "image" : "text",
              content: f.content,
              fileName: f.fileName,
            })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const presentation: Presentation = data.presentation;

      if (!presentation?.slides?.length) {
        throw new Error("Invalid response: no slides found");
      }

      setPresentationData(presentation);

      if (outputFormat === "pptx") {
        setPhase("rendering-pptx");
        setTotalSlides(presentation.slides.length);
        setCurrentSlide(0);

        const blob = await generatePPTX(
          presentation,
          styleId,
          (slideIndex: number) => { setCurrentSlide(slideIndex + 1); },
          logoConfig,
          colorOverrides,
        );

        setPptxBlob(blob);
      }

      setPhase("summarizing");
      fetchSummary(presentation, prompt.trim());
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }, [prompt, styleId, language, outputFormat, fetchSummary, userProfile, logoConfig, colorOverrides, attachedFiles]);

  const handleContinueEditing = () => {
    setPhase("idle");
    setErrorMsg("");
    setTotalSlides(0);
    setCurrentSlide(0);
  };

  const isProcessing = phase === "generating-json" || phase === "rendering-pptx" || phase === "summarizing";

  return (
    <div className="min-h-screen flex flex-col">
      <TicketHeader
        onLogout={onLogout}
        userProfile={userProfile}
        onProfileUpdate={onProfileUpdate}
        onProfileRegenerate={onProfileRegenerate}
      />

      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-6 md:p-10">

        {(phase === "idle" || phase === "error") && (
          <>
            {/* Prompt input */}
            <div className="flex items-center gap-3 mb-4">
              <div className="polka-dot w-6 h-6 opacity-30" />
              <span className="font-mono text-xs uppercase tracking-[0.3em]">
                PROMPT INPUT — DESCRIBE YOUR PRESENTATION
              </span>
              <div className="flex-1 border-b-2 border-dashed border-black opacity-30" />
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：帮我生成一份针对 Coty 集团的 AI 知识库售前汇报，强调检索效率提升，8页"
              className="
                w-full h-48 md:h-56 p-6
                font-mono text-base leading-relaxed
                bg-white border-4 border-black
                placeholder:text-gray-400 placeholder:text-sm
                resize-none
                focus:outline-none focus:ring-0
              "
            />

            <div className="flex justify-between items-center mt-2 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                {prompt.length} CHARS
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                UTF-8 ENCODED
              </span>
            </div>

            {/* Config panel */}
            <div className="mb-4">
              <ConfigPanel
                format={outputFormat}
                styleId={styleId}
                language={language}
                onFormatChange={setOutputFormat}
                onStyleChange={setStyleId}
                onLanguageChange={setLanguage}
              />
            </div>

            {/* File upload zone */}
            <div className="mb-4">
              <FileUploadZone
                files={attachedFiles}
                onFilesChange={setAttachedFiles}
              />
            </div>

            {/* Template panel */}
            <div className="mb-4">
              <TemplatePanel
                logoData={logoData}
                logoPosition={logoPosition}
                onLogoChange={handleLogoChange}
                onLogoPositionChange={handleLogoPositionChange}
                colorOverrides={colorOverrides}
                baseColors={getStyleById(styleId).colors}
                onColorOverridesChange={handleColorOverridesChange}
              />
            </div>

            {phase === "error" && (
              <div className="mb-4 border-4 border-red-600 bg-red-50 p-4">
                <p className="font-mono text-xs uppercase tracking-widest text-red-600">
                  [ SYSTEM ERROR ] {errorMsg}
                </p>
              </div>
            )}

            {/* Generate button */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="
                  flex-1 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em]
                  bg-black text-[#F4F1EA] border-4 border-black
                  hover:bg-[#F4F1EA] hover:text-black
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-[#F4F1EA]
                  transition-colors duration-150 cursor-pointer
                "
              >
                [ GENERATE {outputFormat.toUpperCase()} ]
              </button>
            </div>
          </>
        )}

        {/* Processing terminal */}
        {isProcessing && (
          <div className="mb-6">
            <TerminalStatus
              phase={phase === "summarizing" ? "rendering-pptx" : phase as "generating-json" | "rendering-pptx"}
              totalSlides={totalSlides}
              currentSlide={currentSlide}
            />
            {phase === "summarizing" && (
              <div className="mt-3 bg-black border-4 border-black p-4">
                <p className="font-mono text-sm text-yellow-400">
                  {"> "}AI ASSISTANT COMPOSING SUMMARY...
                  <span className="cursor-blink ml-1">█</span>
                </p>
              </div>
            )}
            <div className="mt-4 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] bg-black text-green-400 border-4 border-black text-center">
              {phase === "generating-json" && "PROCESSING..."}
              {phase === "rendering-pptx" && "RENDERING SLIDES..."}
              {phase === "summarizing" && "FINALIZING..."}
            </div>
          </div>
        )}

        {/* Completion panel */}
        {phase === "done" && presentationData && (
          <CompletionPanel
            presentation={presentationData}
            pptxBlob={pptxBlob}
            summary={aiSummary}
            summaryLoading={summaryLoading}
            outputFormat={outputFormat}
            styleId={styleId}
            logoConfig={logoConfig}
            colorOverrides={colorOverrides}
            onContinueEditing={handleContinueEditing}
          />
        )}

        {/* Footer */}
        <div className="mt-auto pt-10">
          <div className="border-t-4 border-dashed border-black pt-3 flex justify-between items-center">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-30">
              COSLIDE SYSTEMS — DECK FABRICATION UNIT
            </span>
            <div className="barcode w-32 h-5 opacity-30" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-30">
              BUILD 2026.02
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
