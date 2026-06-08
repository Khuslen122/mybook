"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Date picker that submits the chosen date as a hidden `yyyy-MM-dd` input,
 * so it works inside a plain <form action={...}>.
 */
export function DatePicker({
  name,
  defaultValue,
  placeholder = "Pick a date",
}: {
  name: string
  /** ISO date (yyyy-MM-dd) to preselect */
  defaultValue?: string
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(() =>
    defaultValue ? new Date(defaultValue) : undefined
  )

  const now = new Date()

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={date ? format(date, "yyyy-MM-dd") : ""}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-9 w-full justify-start gap-2 px-3 font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="size-4 opacity-70" />
              {date ? format(date, "PPP") : placeholder}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              setDate(d)
              setOpen(false)
            }}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date(now.getFullYear(), 11)}
            disabled={{ after: now }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
