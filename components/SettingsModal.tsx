"use client";

import { useState, useEffect } from "react";
import {
  type LLMConfig,
  type LLMProvider,
  PROVIDER_OPTIONS,
  loadLLMConfig,
  saveLLMConfig,
  clearLLMConfig,
} from "@/lib/llm-config";

interface SettingsModalProps {
  onClose: () => void;
  onConfigChange: (config: LLMConfig | null) => void;
}

export default function SettingsModal({ onClose, onConfigChange }: SettingsModalProps) {
  const [provider, setProvider] = useState<LLMProvider>("azure-openai");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [apiVersion, setApiVersion] = useState("2024-12-01-preview");
  const [saved, setSaved] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    const existing = loadLLMConfig();
    if (existing) {
      setProvider(existing.provider);
      setEndpoint(existing.endpoint || "");
      setApiKey(existing.apiKey || "");
      setModel(existing.model || "");
      setApiVersion(existing.apiVersion || "2024-12-01-preview");
      setHasExisting(true);
    }
  }, []);

  const selectedProvider = PROVIDER_OPTIONS.find((p) => p.id === provider)!;

  function handleSave() {
    const config: LLMConfig = {
      provider,
      endpoint: endpoint.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      ...(provider === "azure-openai" ? { apiVersion } : {}),
    };
    saveLLMConfig(config);
    onConfigChange(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    clearLLMConfig();
    setEndpoint("");
    setApiKey("");
    setModel("");
    setHasExisting(false);
    onConfigChange(null);
  }

  const canSave = apiKey.trim() && model.trim() && (selectedProvider.needsEndpoint ? endpoint.trim() : true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#F4F1EA] border-4 border-black max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-black text-[#F4F1EA] px-5 py-3 flex items-center justify-between sticky top-0 z-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em]">
            LLM CONFIGURATION
          </span>
          <button
            onClick={onClose}
            className="font-mono text-sm hover:opacity-60 transition-opacity cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Provider selection */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
              PROVIDER
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDER_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id);
                    setModel("");
                    setEndpoint("");
                  }}
                  className={`
                    py-2.5 px-3 font-mono text-xs uppercase tracking-wider text-left border-2 transition-all cursor-pointer
                    ${provider === p.id
                      ? "bg-black text-[#F4F1EA] border-black"
                      : "bg-white text-black border-black hover:bg-black/5"}
                  `}
                >
                  <span className="font-bold block">{p.label}</span>
                  <span className={`text-[8px] tracking-normal normal-case block mt-0.5 ${provider === p.id ? "opacity-60" : "opacity-40"}`}>
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint */}
          {selectedProvider.needsEndpoint && (
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                API ENDPOINT
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder={selectedProvider.endpointPlaceholder}
                className="w-full px-3 py-2.5 font-mono text-sm bg-white border-2 border-black placeholder:text-black/20 focus:outline-none"
              />
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
              API KEY
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 font-mono text-sm bg-white border-2 border-black placeholder:text-black/20 focus:outline-none"
            />
            <p className="font-mono text-[8px] tracking-wider mt-1 opacity-30 uppercase">
              Stored locally in your browser — never sent to our servers
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
              MODEL / DEPLOYMENT
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={selectedProvider.modelPlaceholder}
              className="w-full px-3 py-2.5 font-mono text-sm bg-white border-2 border-black placeholder:text-black/20 focus:outline-none"
            />
          </div>

          {/* API Version (Azure only) */}
          {provider === "azure-openai" && (
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                API VERSION
              </label>
              <input
                type="text"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
                placeholder="2024-12-01-preview"
                className="w-full px-3 py-2.5 font-mono text-sm bg-white border-2 border-black placeholder:text-black/20 focus:outline-none"
              />
            </div>
          )}

          {/* Save button */}
          <div className="border-t-2 border-dashed border-black/20 pt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`
                flex-1 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-black transition-all cursor-pointer
                ${saved
                  ? "bg-green-800 text-white border-green-800"
                  : "bg-black text-[#F4F1EA] hover:bg-[#F4F1EA] hover:text-black"}
                disabled:opacity-30 disabled:cursor-not-allowed
              `}
            >
              {saved ? "[ SAVED ✓ ]" : "[ SAVE CONFIGURATION ]"}
            </button>
            {hasExisting && (
              <button
                onClick={handleClear}
                className="py-3 px-4 font-mono text-[10px] uppercase tracking-wider text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Status indicator */}
          <div className="border-t-2 border-dashed border-black/20 pt-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${hasExisting || apiKey ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">
                {hasExisting || apiKey
                  ? `Using: Custom ${selectedProvider.label} Config`
                  : "Using: Environment Variables (Default)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
