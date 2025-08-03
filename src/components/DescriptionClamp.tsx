import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export default function DescriptionClamp({
  text,
  lines = 6,
  className,
}: {
  text?: string;
  lines?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const pRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = pRef.current;
    if (!el) return;
    
    const check = () => {
      const isClamped = el.scrollHeight > el.clientHeight + 2;
      setClamped(isClamped);
    };
    
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    
    return () => ro.disconnect();
  }, [text, lines]);

  return (
    <div className={clsx("relative overflow-hidden w-full", className)}>
      <p
        ref={pRef}
        className={clsx(
          "text-[14px] text-slate-200/90 leading-relaxed break-words w-full min-w-0",
          !expanded && `line-clamp-${lines}`
        )}
        style={{
          display: !expanded ? '-webkit-box' : 'block',
          WebkitBoxOrient: !expanded ? 'vertical' : undefined,
          WebkitLineClamp: !expanded ? lines : undefined,
          overflow: !expanded ? 'hidden' : 'visible',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          maxWidth: '100%'
        }}
      >
        {text || "Ingen beskrivelse tilgængelig."}
      </p>

      {/* Glass fade – kun når clamped & ikke expanded */}
      {!expanded && clamped && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
          style={{
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
            maskImage: "linear-gradient(to top, black, transparent)",
          }}
          aria-hidden
        />
      )}

      {/* Inline toggle – kun når clamped */}
      {clamped && (
        <div className="mt-2 w-full">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-[13px] text-slate-300 hover:text-slate-100 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-expanded={expanded}
          >
            {expanded ? "Vis mindre" : "Vis mere"}
          </button>
        </div>
      )}
    </div>
  );
} 