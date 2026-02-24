"use client";

import { useState, useEffect, useRef } from "react";
import type { LogoPosition } from "@/lib/types";
import type { StyleColors } from "@/lib/presets";

const TUNABLE_KEYS: { key: keyof StyleColors; label: string }[] = [
  { key: "dark", label: "DARK" },
  { key: "accent", label: "ACCENT" },
  { key: "title", label: "TITLE" },
  { key: "body", label: "BODY" },
  { key: "muted", label: "MUTED" },
  { key: "light", label: "LIGHT" },
];

interface TemplatePanelProps {
  logoData: string | null;
  logoPosition: LogoPosition;
  onLogoChange: (data: string | null) => void;
  onLogoPositionChange: (pos: LogoPosition) => void;
  colorOverrides: Partial<StyleColors>;
  baseColors: StyleColors;
  onColorOverridesChange: (overrides: Partial<StyleColors>) => void;
}

export default function TemplatePanel({
  logoData,
  logoPosition,
  onLogoChange,
  onLogoPositionChange,
  colorOverrides,
  baseColors,
  onColorOverridesChange,
}: TemplatePanelProps) {
  const [colorsExpanded, setColorsExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo 文件大小不能超过 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onLogoChange(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleColorChange(key: keyof StyleColors, hex: string) {
    const clean = hex.replace("#", "");
    onColorOverridesChange({ ...colorOverrides, [key]: clean });
  }

  function handleResetColors() {
    onColorOverridesChange({});
  }

  const hasOverrides = Object.keys(colorOverrides).length > 0;

  return (
    <div className="border-4 border-black bg-[#F4F1EA]">
      <div className="bg-black text-[#F4F1EA] px-4 py-2 font-mono text-[10px] tracking-[0.3em] uppercase">
        TEMPLATE CUSTOMIZATION
      </div>

      <div className="p-4 space-y-4">
        {/* Logo Section */}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 block mb-2">
            BRAND LOGO
          </span>
          <div className="flex items-center gap-3">
            {logoData ? (
              <div className="border-2 border-black bg-white p-1 w-14 h-14 flex items-center justify-center">
                <img
                  src={logoData}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-black/30 w-14 h-14 flex items-center justify-center">
                <span className="font-mono text-[10px] text-black/30">LOGO</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => fileRef.current?.click()}
                className="
                  px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest
                  border-2 border-black bg-white
                  hover:bg-black hover:text-[#F4F1EA]
                  transition-colors cursor-pointer
                "
              >
                {logoData ? "更换" : "上传"}
              </button>
              {logoData && (
                <button
                  onClick={() => onLogoChange(null)}
                  className="
                    px-3 py-1 font-mono text-[10px] uppercase tracking-widest
                    text-black/40 hover:text-red-600
                    transition-colors cursor-pointer
                  "
                >
                  移除
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Position selector */}
            {logoData && (
              <div className="ml-auto flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                  POS:
                </span>
                {(["top-right", "bottom-left"] as LogoPosition[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => onLogoPositionChange(pos)}
                    className={`
                      px-2 py-1 font-mono text-[9px] uppercase tracking-wider
                      border-2 transition-colors cursor-pointer
                      ${logoPosition === pos
                        ? "border-black bg-black text-[#F4F1EA]"
                        : "border-black/30 bg-white hover:border-black"
                      }
                    `}
                  >
                    {pos === "top-right" ? "右上" : "左下"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Color fine-tuning */}
        <div>
          <button
            onClick={() => setColorsExpanded(!colorsExpanded)}
            className="flex items-center gap-2 cursor-pointer group w-full"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
              COLOR FINE-TUNING
            </span>
            <span className="font-mono text-xs opacity-40">
              {colorsExpanded ? "▾" : "▸"}
            </span>
            {hasOverrides && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-black/40 ml-auto">
                {Object.keys(colorOverrides).length} MODIFIED
              </span>
            )}
          </button>

          {colorsExpanded && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TUNABLE_KEYS.map(({ key, label }) => {
                  const currentValue = colorOverrides[key] || baseColors[key];
                  const isOverridden = key in colorOverrides;
                  return (
                    <div
                      key={key}
                      className={`
                        flex items-center gap-2 px-2 py-1.5 border-2
                        ${isOverridden ? "border-black bg-white" : "border-black/20 bg-white/50"}
                      `}
                    >
                      <input
                        type="color"
                        value={`#${currentValue}`}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-6 h-6 border-0 p-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[9px] uppercase tracking-widest flex-1">
                        {label}
                      </span>
                      <span className="font-mono text-[8px] text-black/40">
                        #{currentValue}
                      </span>
                    </div>
                  );
                })}
              </div>

              {hasOverrides && (
                <button
                  onClick={handleResetColors}
                  className="
                    font-mono text-[10px] uppercase tracking-widest
                    text-black/40 hover:text-black
                    transition-colors cursor-pointer
                  "
                >
                  [ 重置为默认 ]
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
