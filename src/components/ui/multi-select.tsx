"use client"

import * as React from "react"
import { Check, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  maxDisplay?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Pilih...",
  maxDisplay = 2
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option]
    onChange(newSelected)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const displayText = () => {
    if (selected.length === 0) return placeholder
    if (selected.length <= maxDisplay) {
      return selected.join(", ")
    }
    return `${selected.slice(0, maxDisplay).join(", ")} +${selected.length - maxDisplay}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <span className="truncate">{displayText()}</span>
          <div className="flex items-center gap-1">
            {selected.length > 0 && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-[300px] overflow-auto p-1">
          {options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada data
            </div>
          ) : (
            options.map((option) => {
              const isSelected = selected.includes(option)
              return (
                <div
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  <span>{option}</span>
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
