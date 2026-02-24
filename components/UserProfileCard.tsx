"use client";

import { useState, useRef, useEffect } from "react";

interface UserProfileCardProps {
  profile: string;
  onUpdate: (newProfile: string) => void;
  onRegenerate: () => void;
}

export default function UserProfileCard({ profile, onUpdate, onRegenerate }: UserProfileCardProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSave() {
    if (draft.trim()) {
      onUpdate(draft.trim());
    }
    setEditing(false);
  }

  return (
    <div className="relative" ref={cardRef}>
      <button
        onClick={() => setOpen(!open)}
        className="
          font-mono text-[10px] uppercase tracking-widest
          px-3 py-2 border-2 border-black
          hover:bg-black hover:text-[#F4F1EA]
          transition-colors duration-150 cursor-pointer
          flex items-center gap-1.5
        "
        title="用户画像"
      >
        <span className="text-sm">◉</span>
        <span className="hidden md:inline">PROFILE</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#F4F1EA] border-4 border-black z-50 shadow-[4px_4px_0_#000]">
          <div className="bg-black text-[#F4F1EA] px-3 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
              USER PROFILE
            </span>
            <button
              onClick={() => { setOpen(false); setEditing(false); }}
              className="font-mono text-xs hover:opacity-60 transition-opacity cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-3">
            {editing ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="
                  w-full h-24 p-2 font-mono text-xs leading-relaxed
                  bg-white border-2 border-black resize-none
                  focus:outline-none
                "
              />
            ) : (
              <div className="bg-white border-2 border-black/30 p-3">
                <p className="text-xs leading-relaxed text-[#333]">{profile}</p>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="
                      flex-1 py-1.5 font-mono text-[10px] uppercase tracking-widest
                      bg-black text-[#F4F1EA] border-2 border-black
                      hover:bg-[#F4F1EA] hover:text-black
                      transition-colors cursor-pointer
                    "
                  >
                    保存
                  </button>
                  <button
                    onClick={() => { setDraft(profile); setEditing(false); }}
                    className="
                      px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest
                      border-2 border-black/30 text-black/50
                      hover:border-black hover:text-black
                      transition-colors cursor-pointer
                    "
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="
                      flex-1 py-1.5 font-mono text-[10px] uppercase tracking-widest
                      border-2 border-black bg-white
                      hover:bg-black hover:text-[#F4F1EA]
                      transition-colors cursor-pointer
                    "
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => { onRegenerate(); setOpen(false); }}
                    className="
                      flex-1 py-1.5 font-mono text-[10px] uppercase tracking-widest
                      border-2 border-black/30 text-black/50
                      hover:border-black hover:text-black
                      transition-colors cursor-pointer
                    "
                  >
                    重新生成
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-black/20 px-3 py-1">
            <span className="font-mono text-[8px] tracking-widest uppercase opacity-30">
              STORED LOCALLY • INJECTED INTO CONTEXT
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
