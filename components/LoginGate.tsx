"use client";

import { useState, FormEvent } from "react";

const VALID_PASSWORD = "guido2026";

export default function LoginGate({
  onLogin,
}: {
  onLogin: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password === VALID_PASSWORD) {
      localStorage.setItem("coslide_auth", "1");
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Polka dot decorative corners */}
      <div className="polka-dot fixed top-0 left-0 w-32 h-full opacity-10 pointer-events-none" />
      <div className="polka-dot fixed top-0 right-0 w-32 h-full opacity-10 pointer-events-none" />

      <div
        className={`
          w-full max-w-md bg-[#F4F1EA] border-4 border-black relative
          ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}
        `}
        style={{
          animationName: shake ? "shake" : undefined,
        }}
      >
        {/* Top ticket strip */}
        <div className="border-b-4 border-dashed border-black px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-xs tracking-widest uppercase">
            [ NO. 2026-BP-001 ]
          </span>
          <div className="barcode w-24 h-8" />
        </div>

        {/* System alert badge */}
        <div className="bg-black text-[#F4F1EA] px-6 py-2 font-mono text-xs tracking-[0.3em] uppercase text-center">
          SYSTEM ALERT — RESTRICTED ACCESS ZONE
        </div>

        {/* Main form area */}
        <form onSubmit={handleSubmit} className="px-8 py-10">
          <h1 className="font-mono text-4xl font-black uppercase tracking-tight leading-none mb-2">
            MANDATORY
          </h1>
          <h1 className="font-mono text-4xl font-black uppercase tracking-tight leading-none mb-8">
            LOGIN
          </h1>

          <label className="block font-mono text-xs uppercase tracking-widest mb-2">
            ENTER ACCESS CODE:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="••••••••"
            className={`
              w-full px-4 py-3 font-mono text-lg tracking-widest
              bg-white border-4 border-black
              placeholder:text-gray-400
              focus:outline-none focus:ring-0
              ${error ? "border-red-600 bg-red-50" : ""}
            `}
            autoFocus
          />

          {error && (
            <p className="font-mono text-xs uppercase tracking-widest mt-2 text-red-600">
              [ ERROR ] INVALID ACCESS CODE — RETRY
            </p>
          )}

          <button
            type="submit"
            className="
              mt-6 w-full py-4 font-mono text-sm font-bold uppercase tracking-[0.2em]
              bg-black text-[#F4F1EA] border-4 border-black
              hover:bg-[#F4F1EA] hover:text-black
              transition-colors duration-150 cursor-pointer
            "
          >
            [ SUBMIT TICKET ]
          </button>
        </form>

        {/* Bottom ticket strip */}
        <div className="border-t-4 border-dashed border-black px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-60">
            AUTHORIZED PERSONNEL ONLY
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-60">
            REV. 02/2026
          </span>
        </div>

        {/* Decorative barcode footer */}
        <div className="barcode w-full h-6 border-t-4 border-black" />
      </div>
    </div>
  );
}
