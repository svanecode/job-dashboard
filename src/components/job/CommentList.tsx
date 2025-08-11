"use client";

import { MessageSquare } from "lucide-react";

type Comment = { id: string; user: string; text: string; createdAt: string };

export function CommentList({ comments }: { comments: Comment[] }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-neutral-500 text-sm">
        <MessageSquare className="size-4" />
        Ingen kommentarer endnu.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {comments.map((c) => (
        <li key={c.id} className="rounded-lg bg-white/5 border border-white/10 p-3">
          <div className="text-xs text-neutral-400 mb-1">
            {c.user} • {new Date(c.createdAt).toLocaleString('da-DK')}
          </div>
          <div className="text-sm text-neutral-200 whitespace-pre-wrap">{c.text}</div>
        </li>
      ))}
    </ul>
  );
}

