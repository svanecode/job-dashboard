'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your message...",
  disabled = false,
  isLoading = false
}: ChatInputProps) {
  const [isComposing, setIsComposing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value?.trim() && !isComposing && !disabled && !isLoading) {
      onSubmit(value.trim())
      onChange('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value?.trim() && !isComposing && !disabled && !isLoading) {
        onSubmit(value.trim())
        onChange('')
      }
    }
  }

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading])

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="pr-2"
        />
        {/* removed mic, attach, and search icons */}
      </div>
              <Button
          type="submit"
          size="sm"
          disabled={!value?.trim() || disabled || isLoading || isComposing}
          className="px-4"
        >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
} 