"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark, NavLinks } from "./Sidebar";

/**
 * Slide-in navigation drawer for narrow viewports. The fixed <Sidebar> is
 * hidden below the md breakpoint entirely, so without this there was no way
 * to move between sections on a phone — this is what makes the rest of the
 * "best UI" work actually reachable on mobile.
 */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Lock body scroll while the drawer is open, and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-30 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex w-64 max-w-[80vw] flex-col border-r border-border bg-bg-raised transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-5">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[13px] font-semibold tracking-tight text-text-primary">
              ResolveIQ
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors duration-150 hover:bg-panel hover:text-text-primary"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <NavLinks onNavigate={onClose} />

        <div className="border-t border-border px-5 py-4">
          <p className="text-[11px] leading-relaxed text-text-tertiary">
            Team K-DON<br />Customer Support track
          </p>
        </div>
      </aside>
    </div>
  );
}
