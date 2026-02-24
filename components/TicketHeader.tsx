"use client";

import Image from "next/image";
import UserProfileCard from "./UserProfileCard";

interface TicketHeaderProps {
  onLogout: () => void;
  userProfile?: string | null;
  onProfileUpdate?: (profile: string) => void;
  onProfileRegenerate?: () => void;
}

export default function TicketHeader({
  onLogout,
  userProfile,
  onProfileUpdate,
  onProfileRegenerate,
}: TicketHeaderProps) {
  return (
    <header className="border-b-4 border-black bg-[#F4F1EA] relative">
      {/* Main header row */}
      <div className="flex items-stretch">
        {/* Logo + title section */}
        <div className="flex items-center gap-4 px-6 py-4 flex-1">
          <Image
            src="/coslide_logo.png"
            alt="CoSlide"
            width={48}
            height={48}
            className="w-12 h-12 object-contain"
          />
          <div>
            <h1 className="font-mono text-xl font-black uppercase tracking-tight leading-none">
              CoSlide PPTX GENERATOR
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] mt-1 opacity-60">
              NATURAL LANGUAGE → PRESENTATION ENGINE
            </p>
          </div>
        </div>

        {/* Polka dot decorative strip */}
        <div className="polka-dot w-16 border-l-4 border-black opacity-20" />

        {/* Ticket info + barcode section */}
        <div className="flex items-center gap-4 px-6 py-4 border-l-4 border-black">
          <div className="text-right">
            <p className="font-mono text-xs tracking-widest uppercase">
              [ NO. 2026-BP-001 ]
            </p>
            <p className="font-mono text-[10px] tracking-widest uppercase mt-1 opacity-60">
              SESSION ACTIVE
            </p>
          </div>
          <div className="barcode w-20 h-10" />
          {userProfile && onProfileUpdate && onProfileRegenerate && (
            <UserProfileCard
              profile={userProfile}
              onUpdate={onProfileUpdate}
              onRegenerate={onProfileRegenerate}
            />
          )}
          <button
            onClick={onLogout}
            className="
              font-mono text-[10px] uppercase tracking-widest
              px-3 py-2 border-2 border-black
              hover:bg-black hover:text-[#F4F1EA]
              transition-colors duration-150 cursor-pointer
            "
          >
            EXIT
          </button>
        </div>
      </div>

      {/* Bottom dashed separator */}
      <div className="border-t-4 border-dashed border-black px-6 py-1 flex justify-between">
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase opacity-40">
          ShangHai NanyangWanbang Technology INC.
        </span>
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase opacity-40">
          AI-POWERED DECK FABRICATION
        </span>
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase opacity-40">
          V1.0.0-BETA
        </span>
      </div>
    </header>
  );
}
