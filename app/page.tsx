"use client";

import { useState, useEffect } from "react";
import LoginGate from "@/components/LoginGate";
import Workbench from "@/components/Workbench";

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(localStorage.getItem("coslide_auth") === "1");
  }, []);

  function handleLogout() {
    localStorage.removeItem("coslide_auth");
    setAuthed(false);
  }

  // SSR hydration guard — render nothing until client knows auth state
  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm uppercase tracking-widest opacity-40 cursor-blink">
          INITIALIZING...
        </span>
      </div>
    );
  }

  if (!authed) {
    return <LoginGate onLogin={() => setAuthed(true)} />;
  }

  return <Workbench onLogout={handleLogout} />;
}
