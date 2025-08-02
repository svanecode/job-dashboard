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
    <div
      className={clsx(
        "relative rounded-lg border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden",
        className
      )}
    >
      <p
        ref={pRef}
        className={clsx(
          "p-3 text-slate-200/90 break-words leading-relaxed",
          !expanded && `line-clamp-${lines}`
        )}
        style={{
          display: !expanded ? '-webkit-box' : 'block',
          WebkitBoxOrient: !expanded ? 'vertical' : undefined,
          WebkitLineClamp: !expanded ? lines : undefined,
          overflow: !expanded ? 'hidden' : 'visible'
        }}
      >
        {text || "Ingen beskrivelse tilgængelig."}
      </p>

      {/* Fade – kun når clamped & ikke expanded */}
      {!expanded && clamped && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
          style={{
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
            maskImage: "linear-gradient(to top, black, transparent)",
            background: "inherit",
            backdropFilter: "inherit",
          }}
          aria-hidden
        />
      )}

      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="absolute bottom-2 right-2 z-10 rounded-md px-2 py-1 text-xs
                     text-slate-100 bg-black/35 hover:bg-black/45 border border-white/10
                     backdrop-blur-sm transition-all duration-200 focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-white/20"
          aria-expanded={expanded}
        >
          {expanded ? "Vis mindre" : "Vis mere"}
        </button>
      )}
    </div>
  );
} 