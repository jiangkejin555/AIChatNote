'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTags } from '@/hooks'
import { useTranslations } from '@/i18n'

interface TagSelectorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  className?: string
}

export function TagSelector({ tags, onChange, className }: TagSelectorProps) {
  const t = useTranslations()
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: existingTags } = useTags()

  const filteredSuggestions = existingTags
    ?.filter(
      (tag) =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(tag.name)
    )
    .slice(0, 5) || []

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        handleAddTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1])
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
        >
          {tag}
          <button
            type="button"
            onClick={() => handleRemoveTag(tag)}
            className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            aria-label={t('notes.removeTag', { tag })}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <div className="relative">
        <div className="flex items-center gap-1 bg-background border border-input rounded-md px-2 py-1">
          <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length === 0 ? t('notes.addTag') : ''}
            className="h-5 w-20 border-0 shadow-none focus-visible:ring-0 px-0 text-sm bg-transparent"
          />
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 z-10 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
            {filteredSuggestions.map((tag) => (
              <button
                key={tag.name}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => handleAddTag(tag.name)}
              >
                <Badge variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {t('notes.noteCount', { count: String(tag.count) })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
