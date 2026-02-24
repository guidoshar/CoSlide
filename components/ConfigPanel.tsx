"use client";

import { STYLE_PRESETS, LANGUAGES, type OutputFormat } from "@/lib/presets";

interface ConfigPanelProps {
  format: OutputFormat;
  styleId: string;
  language: string;
  onFormatChange: (f: OutputFormat) => void;
  onStyleChange: (s: string) => void;
  onLanguageChange: (l: string) => void;
}

export default function ConfigPanel({
  format,
  styleId,
  language,
  onFormatChange,
  onStyleChange,
  onLanguageChange,
}: ConfigPanelProps) {
  return (
    <div className="border-4 border-black bg-[#F4F1EA]">
      {/* Header */}
      <div className="bg-black text-[#F4F1EA] px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase">
        OUTPUT CONFIGURATION
      </div>

      <div className="p-4 space-y-5">
        {/* Row 1: Format + Language */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Format selector */}
          <div className="flex-1">
            <span className="block font-mono text-[10px] uppercase tracking-[0.3em] mb-2 opacity-60">
              OUTPUT FORMAT
            </span>
            <div className="flex gap-2">
              {(["pptx", "html"] as OutputFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onFormatChange(f)}
                  className={`
                    flex-1 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em]
                    border-4 border-black transition-colors duration-150 cursor-pointer
                    ${format === f
                      ? "bg-black text-[#F4F1EA]"
                      : "bg-white text-black hover:bg-gray-100"
                    }
                  `}
                >
                  [ {f.toUpperCase()} ]
                </button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div className="flex-1">
            <span className="block font-mono text-[10px] uppercase tracking-[0.3em] mb-2 opacity-60">
              LANGUAGE
            </span>
            <div className="flex gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => onLanguageChange(lang.id)}
                  className={`
                    flex-1 py-3 font-mono text-xs font-bold uppercase tracking-widest
                    border-2 border-black transition-colors duration-150 cursor-pointer
                    ${language === lang.id
                      ? "bg-black text-[#F4F1EA]"
                      : "bg-white text-black hover:bg-gray-100"
                    }
                  `}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Style presets */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">
              VISUAL STYLE
            </span>
            <div className="flex-1 border-b border-dashed border-black opacity-20" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onStyleChange(preset.id)}
                className={`
                  text-left p-3 border-4 transition-all duration-150 cursor-pointer
                  ${styleId === preset.id
                    ? "border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : "border-black/30 bg-white hover:border-black"
                  }
                `}
              >
                {/* Color preview strip */}
                <div className="flex gap-0.5 mb-2">
                  <div
                    className="w-6 h-3 border border-black/20"
                    style={{ background: `#${preset.colors.dark}` }}
                  />
                  <div
                    className="w-6 h-3 border border-black/20"
                    style={{ background: `#${preset.colors.accent}` }}
                  />
                  <div
                    className="w-6 h-3 border border-black/20"
                    style={{ background: `#${preset.colors.light}` }}
                  />
                </div>
                <p className="font-mono text-xs font-bold uppercase tracking-widest">
                  {preset.nameEn}
                </p>
                <p className="font-mono text-[10px] mt-0.5 opacity-70">
                  {preset.name}
                </p>
                <p className="text-[10px] mt-1 leading-tight opacity-50">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom dashed line */}
      <div className="border-t-4 border-dashed border-black px-4 py-1.5 flex justify-between">
        <span className="font-mono text-[9px] uppercase tracking-widest opacity-30">
          FORMAT: {format.toUpperCase()} | STYLE: {STYLE_PRESETS.find(s => s.id === styleId)?.nameEn || "—"} | LANG: {language.toUpperCase()}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest opacity-30">
          READY
        </span>
      </div>
    </div>
  );
}
