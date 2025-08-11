"use client";

import { useCallback, useState } from "react";
import { Send } from "lucide-react";

export function CommentInput({ onSubmit }: { onSubmit: (text: string) => Promise<void> | void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async () => {
    const value = text.trim();
    if (!value) return;
    setLoading(true);
    await onSubmit(value);
    setText("");
    setLoading(false);
  }, [onSubmit, text]);

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter')) submit();
        }}
        placeholder="Skriv en kommentar…"
        aria-label="Tilføj kommentar"
        className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-neutral-900"
      />
      <button
        onClick={submit}
        disabled={loading || !text.trim()}
        aria-label="Send kommentar"
        className="h-10 px-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-neutral-600 inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </button>
    </div>
  );
}

