'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, Sparkles } from 'lucide-react'

export interface ModelPickerProps {
  value?: string
  onValueChange?: (value: string) => void
  models?: Array<{
    id: string
    name: string
    description?: string
  }>
}

const defaultModels = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable model'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic\'s latest model'
  }
]

export function ModelPicker({ 
  value, 
  onValueChange, 
  models = defaultModels 
}: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  
  const selectedModel = models.find(m => m.id === value) || models[0]
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          {selectedModel.name}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {models.map((model) => (
            <Button
              key={model.id}
              variant={value === model.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => {
                onValueChange?.(model.id)
                setOpen(false)
              }}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{model.name}</span>
                {model.description && (
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
} 