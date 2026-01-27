import React, { useEffect, useRef, useState } from "react";
import { ProfileDropdown } from "../features/profile-management/components/ProfileDropdown.js";
import { useProfiles } from "../features/profile-management/hooks/useProfiles.js";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profiles, currentProfileId } = useProfiles();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const currentProfile = profiles.find((profile) => profile.id === currentProfileId);
  const avatar = currentProfile?.avatar ?? "👤";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Avaia</div>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-base shadow-sm transition hover:bg-slate-50"
              aria-haspopup="true"
              aria-expanded={isOpen}
            >
              <span className="text-xl" aria-hidden>
                {avatar}
              </span>
              <span className="text-xs font-semibold text-slate-500">▼</span>
            </button>
            {isOpen && <ProfileDropdown onClose={() => setIsOpen(false)} />}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
};
