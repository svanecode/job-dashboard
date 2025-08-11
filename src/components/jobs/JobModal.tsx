"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, MapPin, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ExternalLink, Bookmark } from "lucide-react";
import { Region } from "@/utils/filters";
import { cn } from "@/utils/cn";

export type Job = {
  id: string;
  title: string;
  company?: string;
  location?: string;
  regions?: Region[] | string;
  date?: string;
  urgent?: boolean;
  description?: string;
  url?: string;
};

export type JobModalProps = {
  open: boolean;
  job: Job | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSave?: (jobId: string) => void;
  className?: string;
};

export default function JobModal({ open, job, onClose, onPrev, onNext, onSave, className }: JobModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusable = useRef<HTMLElement | null>(null);
  const lastFocusable = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length) {
          firstFocusable.current = focusables[0];
          lastFocusable.current = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === firstFocusable.current) {
            e.preventDefault();
            lastFocusable.current?.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable.current) {
            e.preventDefault();
            firstFocusable.current?.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, onPrev, onNext]);

  if (!open || !job) return null;
  const regions = Array.isArray(job.regions) ? job.regions : (job.regions ? String(job.regions).split(',').map(s => s.trim()) : []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90]"
      >
        {/* overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        {/* dialog */}
        <div className="absolute inset-0 grid place-items-center px-4">
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-modal-title"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "relative bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl p-6 md:p-8 max-w-3xl mx-4 my-8",
              "scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20",
              className
            )}
          >
            {/* Floating top-right controls */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              {onPrev && (
                <button onClick={onPrev} aria-label="Forrige job" className="size-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition">
                  <ChevronLeft className="size-4" />
                </button>
              )}
              {onNext && (
                <button onClick={onNext} aria-label="Næste job" className="size-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition">
                  <ChevronRight className="size-4" />
                </button>
              )}
              <button onClick={onClose} aria-label="Luk" className="size-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition">
                ×
              </button>
            </div>
            {/* header */}
            <div className="mb-6 px-4">
              <h2 id="job-modal-title" className="text-xl font-semibold text-white">
                {job.title}
              </h2>
              
              {job.urgent && (
                <span className="inline-flex items-center rounded-full bg-blue-500/15 text-blue-300 text-xs font-medium px-3 py-0.5 mt-3">
                  Akut
                </span>
              )}
              
              <div className="flex items-center gap-4 mt-4 text-sm text-neutral-400">
                {job.company && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4" />
                    {job.company}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {job.location}
                  </span>
                )}
                {job.date && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="size-4" />
                    {new Date(job.date).toLocaleDateString('da-DK')}
                  </span>
                )}
              </div>
              
              <div className="border-t border-white/10 my-6" />
            </div>

            {/* body */}
            <div className="mb-8 px-4 pr-16">
              {job.description ? (
                <div className="prose prose-invert max-w-none text-neutral-200 leading-relaxed text-[15px]">
                  {job.description}
                </div>
              ) : (
                <p className="italic text-neutral-500">Ingen beskrivelse tilgængelig</p>
              )}
            </div>

            {/* comments section */}
            <div className="mb-8 px-4">
              <h3 className="text-sm font-medium text-neutral-400 mb-3">Kommentarer</h3>
              <p className="text-sm text-neutral-500 italic mb-4">Ingen kommentarer endnu. Vær den første til at kommentere!</p>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Skriv en kommentar..."
                  className="h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1"
                />
                <button className="h-10 w-10 rounded-lg bg-blue-500 text-white hover:bg-blue-500/90 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* footer */}
            <div className="flex flex-col items-center gap-4 px-4">
              {/* Buttons row */}
              <div className="flex justify-center items-center gap-3 flex-wrap">
                {job.url && (
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noopener" 
                    className="h-10 min-w-[140px] px-5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-500/90 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ExternalLink className="size-4" />
                    Åbn jobopslag
                  </a>
                )}
                
                {onSave && (
                  <button 
                    onClick={() => onSave(job.id)} 
                    className="h-10 min-w-[140px] px-5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-neutral-300 hover:bg-white/10 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Bookmark className="size-4" />
                    Gem job
                  </button>
                )}
              </div>
            </div>

            {/* navigation and close buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {onPrev && (
                <button 
                  onClick={onPrev} 
                  aria-label="Forrige job" 
                  className="size-8 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition flex items-center justify-center"
                >
                  <ChevronLeft className="size-4" />
                </button>
              )}
              {onNext && (
                <button 
                  onClick={onNext} 
                  aria-label="Næste job" 
                  className="size-8 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition flex items-center justify-center"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
              <button 
                onClick={onClose} 
                aria-label="Luk" 
                className="size-8 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

