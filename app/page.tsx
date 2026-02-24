"use client";

import { useState, useEffect, useCallback } from "react";
import LoginGate from "@/components/LoginGate";
import Workbench from "@/components/Workbench";
import OnboardingModal from "@/components/OnboardingModal";

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const isAuthed = localStorage.getItem("coslide_auth") === "1";
    setAuthed(isAuthed);
    if (isAuthed) {
      const saved = localStorage.getItem("coslide_user_profile");
      if (saved) {
        setUserProfile(saved);
      } else {
        setShowOnboarding(true);
      }
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("coslide_auth");
    setAuthed(false);
  }

  function handleLogin() {
    setAuthed(true);
    const saved = localStorage.getItem("coslide_user_profile");
    if (saved) {
      setUserProfile(saved);
    } else {
      setShowOnboarding(true);
    }
  }

  const handleOnboardingComplete = useCallback((profile: string) => {
    localStorage.setItem("coslide_user_profile", profile);
    setUserProfile(profile);
    setShowOnboarding(false);
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const handleProfileUpdate = useCallback((newProfile: string) => {
    localStorage.setItem("coslide_user_profile", newProfile);
    setUserProfile(newProfile);
  }, []);

  const handleProfileRegenerate = useCallback(() => {
    setShowOnboarding(true);
  }, []);

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
    return <LoginGate onLogin={handleLogin} />;
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      <Workbench
        onLogout={handleLogout}
        userProfile={userProfile}
        onProfileUpdate={handleProfileUpdate}
        onProfileRegenerate={handleProfileRegenerate}
      />
    </>
  );
}
