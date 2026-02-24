"use client";

import { useState } from "react";
import type { HistoryItem } from "@/lib/types";
import { formatTimestamp, deleteFromHistory } from "@/lib/history";
import { STYLE_PRESETS } from "@/lib/presets";

interface HistorySidebarProps {
  items: HistoryItem[];
  currentId: string | null;
  onSelect: (item: HistoryItem) => void;
  onNewSession: () => void;
  onHistoryChange: () => void;
}

export default function HistorySidebar({
  items,
  currentId,
  onSelect,
  onNewSession,
  onHistoryChange,
}: HistorySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleDelete(id: string) {
    deleteFromHistory(id);
    setConfirmDeleteId(null);
    onHistoryChange();
  }

  function getStyleLabel(styleId: string): string {
    return STYLE_PRESETS.find((s) => s.id === styleId)?.nameEn || styleId.toUpperCase();
  }

  if (collapsed) {
    return (
      <div className="w-12 border-r-4 border-black bg-[#F4F1EA] flex flex-col items-center py-4 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="font-mono text-lg hover:opacity-60 transition-opacity cursor-pointer mb-4"
          title="展开侧栏"
        >
          ☰
        </button>
        <button
          onClick={onNewSession}
          className="font-mono text-lg hover:opacity-60 transition-opacity cursor-pointer"
          title="新建"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r-4 border-black bg-[#F4F1EA] flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="bg-black text-[#F4F1EA] px-3 py-2 flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
          HISTORY
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="font-mono text-xs hover:opacity-60 transition-opacity cursor-pointer"
        >
          ◂
        </button>
      </div>

      {/* New session button */}
      <div className="p-2 border-b-2 border-dashed border-black/20 shrink-0">
        <button
          onClick={onNewSession}
          className="
            w-full py-2.5 font-mono text-xs font-bold uppercase tracking-[0.15em]
            bg-black text-[#F4F1EA] border-2 border-black
            hover:bg-[#F4F1EA] hover:text-black
            transition-colors cursor-pointer
          "
        >
          + 新建演示文稿
        </button>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-4 text-center">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-30">
              暂无记录
            </span>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`
                border-b border-black/10 transition-colors
                ${currentId === item.id ? "bg-white" : "hover:bg-white/60"}
              `}
            >
              <button
                onClick={() => onSelect(item)}
                className="w-full text-left p-3 cursor-pointer"
              >
                <p className="font-mono text-xs font-bold leading-tight truncate" title={item.title}>
                  {item.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="font-mono text-[8px] uppercase tracking-wider px-1 py-0.5 border border-black/20 bg-[#F4F1EA]">
                    {item.outputFormat.toUpperCase()}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-wider px-1 py-0.5 border border-black/20 bg-[#F4F1EA]">
                    {getStyleLabel(item.styleId)}
                  </span>
                  <span className="font-mono text-[8px] text-black/40">
                    {item.slideCount}p
                  </span>
                </div>
                <p className="font-mono text-[9px] text-black/40 mt-1">
                  {formatTimestamp(item.createdAt)}
                </p>
              </button>

              {/* Delete */}
              <div className="px-3 pb-2 flex justify-end">
                {confirmDeleteId === item.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="font-mono text-[9px] text-red-600 hover:underline cursor-pointer"
                    >
                      确认删除
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="font-mono text-[9px] text-black/40 hover:text-black cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="font-mono text-[9px] text-black/20 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-dashed border-black/20 px-3 py-1.5 shrink-0">
        <span className="font-mono text-[8px] tracking-widest uppercase opacity-20">
          {items.length} RECORDS • LOCAL
        </span>
      </div>
    </div>
  );
}
