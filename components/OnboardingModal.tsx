"use client";

import { useState, useRef, useEffect } from "react";

type Step = "name" | "profession" | "preferences" | "generating" | "confirm";

interface OnboardingModalProps {
  onComplete: (profile: string) => void;
  onSkip: () => void;
}

const STEP_PROGRESS: Record<Step, number> = {
  name: 20,
  profession: 40,
  preferences: 60,
  generating: 80,
  confirm: 100,
};

function warmResponse(step: Step, value: string): string {
  if (step === "profession") {
    const short = value.length > 15 ? value.slice(0, 15) + "..." : value;
    const reactions = [
      `${short}呀，很酷的职业～我记住了！`,
      `哇，${short}！听起来很厉害呢～`,
      `${short}，这个工作一定很有意思吧～`,
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  return "";
}

export default function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [preferences, setPreferences] = useState("");
  const [professionReaction, setProfessionReaction] = useState("");
  const [profile, setProfile] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (step === "name" || step === "profession") inputRef.current?.focus();
      if (step === "preferences") textareaRef.current?.focus();
    }, 100);
  }, [step]);

  function handleNameSubmit() {
    if (!name.trim()) return;
    setStep("profession");
  }

  function handleProfessionSubmit() {
    if (!profession.trim()) return;
    setProfessionReaction(warmResponse("profession", profession.trim()));
    setStep("preferences");
  }

  async function handlePreferencesSubmit() {
    setStep("generating");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          profession: profession.trim(),
          preferences: preferences.trim(),
        }),
      });

      const data = await res.json();
      setProfile(data.profile || data.error || "生成失败");
      setStep("confirm");
    } catch {
      setProfile(
        `用户"${name.trim()}"是一位${profession.trim()}。${preferences.trim()}`
      );
      setStep("confirm");
    }
  }

  function handleConfirm() {
    onComplete(profile.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent, action: () => void) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#F4F1EA] border-4 border-black">
        {/* Header */}
        <div className="bg-black text-[#F4F1EA] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg">✱</span>
            <span className="font-mono text-xs uppercase tracking-[0.3em]">
              WELCOME TO COSLIDE
            </span>
          </div>
          <span className="font-mono text-[10px] opacity-60">
            {step === "confirm" ? "COMPLETE" : `STEP ${
              step === "name" ? "1/3" : step === "profession" ? "2/3" : step === "preferences" ? "3/3" : "..."
            }`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-black/10 relative">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${STEP_PROGRESS[step]}%` }}
          />
        </div>

        <div className="p-6">

          {/* Step 1: Name */}
          {step === "name" && (
            <>
              <div className="mb-5">
                <p className="text-base leading-relaxed text-[#333]">
                  你好，欢迎使用 CoSlide！
                </p>
                <p className="text-sm leading-relaxed text-[#666] mt-2">
                  方便告诉我怎么称呼你吗？
                </p>
              </div>

              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleNameSubmit)}
                placeholder="你的称呼..."
                className="
                  w-full p-4 font-mono text-sm
                  bg-white border-2 border-black
                  placeholder:text-gray-400
                  focus:outline-none
                "
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleNameSubmit}
                  disabled={!name.trim()}
                  className="
                    flex-1 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em]
                    bg-black text-[#F4F1EA] border-2 border-black
                    hover:bg-[#F4F1EA] hover:text-black
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-colors cursor-pointer
                  "
                >
                  [ 下一步 ]
                </button>
                <button
                  onClick={onSkip}
                  className="
                    px-4 py-3 font-mono text-xs uppercase tracking-widest
                    text-black/40 border-2 border-black/20
                    hover:border-black hover:text-black
                    transition-colors cursor-pointer
                  "
                >
                  跳过
                </button>
              </div>
            </>
          )}

          {/* Step 2: Profession */}
          {step === "profession" && (
            <>
              <div className="mb-5">
                <p className="text-base leading-relaxed text-[#333]">
                  嗯好，<span className="font-bold">{name.trim()}</span> 我记住了！
                </p>
                <p className="text-sm leading-relaxed text-[#666] mt-2">
                  那你平时是做什么工作的呀？
                </p>
              </div>

              <input
                ref={inputRef}
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleProfessionSubmit)}
                placeholder="比如：产品经理、AI解决方案架构师、市场总监..."
                className="
                  w-full p-4 font-mono text-sm
                  bg-white border-2 border-black
                  placeholder:text-gray-400 placeholder:text-xs
                  focus:outline-none
                "
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleProfessionSubmit}
                  disabled={!profession.trim()}
                  className="
                    flex-1 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em]
                    bg-black text-[#F4F1EA] border-2 border-black
                    hover:bg-[#F4F1EA] hover:text-black
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-colors cursor-pointer
                  "
                >
                  [ 下一步 ]
                </button>
                <button
                  onClick={() => setStep("name")}
                  className="
                    px-4 py-3 font-mono text-xs uppercase tracking-widest
                    text-black/40 border-2 border-black/20
                    hover:border-black hover:text-black
                    transition-colors cursor-pointer
                  "
                >
                  返回
                </button>
              </div>
            </>
          )}

          {/* Step 3: Preferences */}
          {step === "preferences" && (
            <>
              <div className="mb-5">
                <p className="text-base leading-relaxed text-[#333]">
                  {professionReaction || `${profession.trim()}，很棒的职业～`}
                </p>
                <p className="text-sm leading-relaxed text-[#666] mt-2">
                  最后问一下，{name.trim()}平时做 PPT 主要是什么场景？有什么风格偏好吗？
                </p>
              </div>

              <textarea
                ref={textareaRef}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="比如：给VP汇报季度业绩，喜欢简洁数据驱动的风格..."
                className="
                  w-full h-24 p-4 font-mono text-sm leading-relaxed
                  bg-white border-2 border-black resize-none
                  placeholder:text-gray-400 placeholder:text-xs
                  focus:outline-none
                "
              />

              {error && (
                <p className="font-mono text-[10px] text-red-600 mt-1">{error}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handlePreferencesSubmit}
                  className="
                    flex-1 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em]
                    bg-black text-[#F4F1EA] border-2 border-black
                    hover:bg-[#F4F1EA] hover:text-black
                    transition-colors cursor-pointer
                  "
                >
                  [ 生成我的画像 ]
                </button>
                <button
                  onClick={() => setStep("profession")}
                  className="
                    px-4 py-3 font-mono text-xs uppercase tracking-widest
                    text-black/40 border-2 border-black/20
                    hover:border-black hover:text-black
                    transition-colors cursor-pointer
                  "
                >
                  返回
                </button>
              </div>
            </>
          )}

          {/* Step: Generating */}
          {step === "generating" && (
            <div className="py-10 text-center">
              <div className="inline-block mb-4">
                <span className="font-mono text-2xl cursor-blink">●</span>
              </div>
              <p className="text-sm text-[#666]">
                稍等一下，{name.trim()}～我正在整理你的信息...
              </p>
              <div className="mt-4 mx-auto w-48 h-1 bg-black/10 overflow-hidden">
                <div className="h-full bg-black animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <>
              <div className="mb-4">
                <p className="text-base leading-relaxed text-[#333]">
                  好啦 {name.trim()}，这是我对你的了解～
                </p>
                <p className="text-xs text-[#999] mt-1">
                  这个描述会帮我更好地为你生成内容，你也可以随时修改
                </p>
              </div>

              {editing ? (
                <textarea
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  className="
                    w-full h-28 p-4 font-mono text-sm leading-relaxed
                    bg-white border-2 border-black resize-none
                    focus:outline-none
                  "
                />
              ) : (
                <div className="bg-white border-2 border-black p-4">
                  <p className="text-sm leading-relaxed text-[#333]">{profile}</p>
                </div>
              )}

              <div className="flex justify-end mt-1 mb-3">
                <button
                  onClick={() => setEditing(!editing)}
                  className="font-mono text-[10px] uppercase tracking-widest text-black/40 hover:text-black transition-colors cursor-pointer"
                >
                  {editing ? "[ 完成编辑 ]" : "[ 手动修改 ]"}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="
                    flex-1 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em]
                    bg-black text-[#F4F1EA] border-2 border-black
                    hover:bg-[#F4F1EA] hover:text-black
                    transition-colors cursor-pointer
                  "
                >
                  [ 开始使用 CoSlide ]
                </button>
                <button
                  onClick={() => { setStep("name"); setEditing(false); }}
                  className="
                    px-4 py-3 font-mono text-xs uppercase tracking-widest
                    text-black/40 border-2 border-black/20
                    hover:border-black hover:text-black
                    transition-colors cursor-pointer
                  "
                >
                  重来
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-dashed border-black/20 px-5 py-2 flex justify-between items-center">
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase opacity-30">
            COSLIDE ONBOARDING
          </span>
          <div className="barcode w-20 h-3 opacity-20" />
        </div>
      </div>
    </div>
  );
}
