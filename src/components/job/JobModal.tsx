"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Building2, MapPin, CalendarDays, ExternalLink, Bookmark, BookmarkCheck, Copy, Check } from "lucide-react";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { CommentList } from "@/components/job/CommentList";
import { CommentInput } from "@/components/job/CommentInput";

export type JobModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job: {
    id: string;
    job_id: string;
    title: string;
    company: string;
    location?: string;
    date: string;
    urgent?: boolean;
    description?: string;
    region?: string;
    score?: 1 | 2 | 3;
    saved?: boolean;
    jobUrl?: string;
  } | null;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleSave?: (saved: boolean) => void;
  onSubmitComment?: (text: string) => Promise<void>;
  comments?: Array<{ id: string; user: string; text: string; createdAt: string }>;
};

export default function JobModal({ open, onOpenChange, job, onPrev, onNext, onToggleSave, onSubmitComment, comments = [] }: JobModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  // focus trap + keys + scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onOpenChange, onPrev, onNext]);

  useEffect(() => {
    const el = dialogRef.current?.querySelector('[data-scroll-body]') as HTMLElement | null;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [open]);

  const saved = !!job?.saved;

  if (!open || !job) return null;

  const dateStr = useMemo(() => new Date(job.date).toLocaleDateString('da-DK'), [job.date]);
  const daysAgo = useMemo(() => {
    const d = new Date(job.date); const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'i dag'; if (diff === 1) return 'i går'; return `for ${diff} dage siden`;
  }, [job.date]);

  const paragraphs = (job.description || '').trim().split(/\n\n+/).filter(Boolean);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
          <div className="absolute inset-0 grid place-items-center px-4">
            <motion.div
              ref={dialogRef}
              role="dialog" aria-modal="true" aria-labelledby="job-modal-title"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.16 }}
              className="mx-auto w-full max-w-3xl rounded-2xl bg-neutral-900/75 backdrop-blur-2xl ring-1 ring-white/10 shadow-2xl relative"
            >
              {/* Floating top-right controls */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                {onPrev && (
                  <button aria-label="Forrige" onClick={onPrev} className="size-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15 text-neutral-200">
                    <ChevronLeft className="size-4" />
                  </button>
                )}
                {onNext && (
                  <button aria-label="Næste" onClick={onNext} className="size-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15 text-neutral-200">
                    <ChevronRight className="size-4" />
                  </button>
                )}
                <button aria-label="Luk" onClick={() => onOpenChange(false)} className="size-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15 text-neutral-200">
                  <X className="size-4" />
                </button>
              </div>
              {/* header */}
              <div className={"sticky top-0 z-10 bg-neutral-900/75 backdrop-blur-2xl " + (scrolled ? "shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]" : "")}> 
                <div className="px-6 pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 pr-16">
                      <div className="flex items-center gap-2 mb-2">
                        {job.score && <ScoreChip score={job.score} />}
                        {job.urgent && <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-red-500 text-white shadow">Akut</span>}
                      </div>
                      <h2 id="job-modal-title" className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-neutral-50 truncate">
                        {job.title}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
                        <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" />{job.company}</span>
                        {job.region && <span className="text-neutral-500">•</span>}
                        {job.region && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> <RegionBadge label={job.region} /></span>}
                        {job.location && <span className="text-neutral-500">•</span>}
                        {job.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{job.location}</span>}
                        <span className="text-neutral-500">•</span>
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{dateStr}</span>
                        <span className="text-neutral-500">•</span>
                        <span className="inline-flex items-center gap-1.5">{daysAgo}</span>
                      </div>
                    </div>
                    {/* controls moved to floating top-right */}
                  </div>
                </div>
                <div className="border-b border-white/10" />
              </div>

              {/* body */}
              <div data-scroll-body className="max-h-[70vh] overflow-y-auto px-6 py-6">
                {paragraphs.length > 0 && (
                  <div className="space-y-4 text-[15px] leading-7 text-neutral-200">
                    {paragraphs.map((p, idx) => (
                      <p key={idx} className="max-w-none">{p}</p>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-neutral-300 mb-2">Kommentarer</h3>
                  <CommentList comments={comments} />
                  {onSubmitComment && (
                    <CommentInput onSubmit={onSubmitComment} />
                  )}
                </div>
              </div>

              {/* footer */}
              <div className={"sticky bottom-0 z-10 bg-neutral-900/80 backdrop-blur-2xl " + (scrolled ? "shadow-[0_-1px_0_rgba(255,255,255,0.08)]" : "")}>
                <div className="px-6 py-4 flex flex-col items-center gap-4">
                  {/* Buttons row */}
                  <div className="flex justify-center items-center gap-3 flex-wrap">
                    {job.jobUrl && (
                      <a href={job.jobUrl} target="_blank" rel="noopener" className="h-10 min-w-[140px] px-5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition flex items-center justify-center gap-2 shadow-sm">
                        <ExternalLink className="size-4" /> Åbn jobopslag
                      </a>
                    )}
                    {onToggleSave && (
                      <button onClick={() => onToggleSave(!saved)} className="h-10 min-w-[140px] px-5 rounded-lg bg-white/10 text-white hover:bg-white/15 transition flex items-center justify-center gap-2 shadow-sm">
                        {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                        {saved ? "Gemt" : "Gem job"}
                      </button>
                    )}
                    <button
                      onClick={() => job.jobUrl && copy(job.jobUrl)}
                      aria-label="Kopiér link"
                      className="h-10 w-10 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-200 inline-flex items-center justify-center"
                    >
                      {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

