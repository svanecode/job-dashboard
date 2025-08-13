'use client'

import { Button } from '@/components/ui/button'
import { ExternalLink, FileText } from 'lucide-react'

export interface SourcesProps {
  sources?: Array<{
    id: string
    title: string
    url?: string
    snippet?: string
  }>
}

export function Sources({ sources }: SourcesProps) {
  if (!sources || sources.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        Sources
      </div>
      <div className="space-y-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="rounded-lg border bg-muted/50 p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="font-medium">{source.title}</div>
                {source.snippet && (
                  <div className="text-muted-foreground line-clamp-2">
                    {source.snippet}
                  </div>
                )}
              </div>
              {source.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  asChild
                >
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 