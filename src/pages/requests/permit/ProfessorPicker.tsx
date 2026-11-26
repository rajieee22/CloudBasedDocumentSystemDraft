import { useEffect, useMemo, useRef, useState } from "react"

import { Icon } from "../../../components/ui"
import type { SignatoryOption } from "../../../lib/studentProfile"

export function ProfessorPicker({
  value,
  userId,
  options,
  onChange,
}: {
  value: string
  userId: string | null
  options: SignatoryOption[]
  onChange: (name: string, userId: string | null) => void
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()

    if (!term) return options

    return options.filter((option) =>
      [option.name, option.email, option.employeeNumber, option.positionTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
  }, [options, query])

  const exactMatch = options.find(
    (option) => option.name.toLowerCase() === query.trim().toLowerCase(),
  )
  const selected = userId
    ? options.find((option) => option.userId === userId)
    : exactMatch
  const trimmed = query.trim()

  const status = selected
    ? `Registered account: ${selected.email}`
    : trimmed
      ? matches.length > 0
        ? "Select a registered account from the list."
        : "No registered account matched. The name will be recorded as entered."
      : "Type a name or select a registered professor."

  function updateQuery(next: string) {
    setQuery(next)
    const match = options.find(
      (option) => option.name.toLowerCase() === next.trim().toLowerCase(),
    )
    onChange(next, match?.userId ?? null)
    setOpen(true)
  }

  function select(option: SignatoryOption) {
    setQuery(option.name)
    onChange(option.name, option.userId)
    setOpen(false)
  }

  return (
    <div className="professor-picker" ref={wrapperRef}>
      <div className="professor-input-wrap">
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false)
          }}
          placeholder="Enter or search a registered professor"
          aria-label="Professor or instructor"
          aria-expanded={open}
        />
        <Icon name="search" size={15} />
      </div>

      {open && (
        <div className="professor-options" role="listbox">
          {matches.length === 0 && (
            <p className="professor-empty">No registered professor found.</p>
          )}

          {matches.map((option) => (
            <button
              type="button"
              className="professor-option"
              key={option.userId}
              role="option"
              aria-selected={selected?.userId === option.userId}
              onClick={() => select(option)}
            >
              <strong>{option.name}</strong>
              <small>
                {[option.positionTitle, option.email]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </button>
          ))}

          {trimmed && !exactMatch && (
            <button
              type="button"
              className="professor-option manual"
              onClick={() => {
                onChange(trimmed, null)
                setOpen(false)
              }}
            >
              <strong>Use “{trimmed}” as entered</strong>
              <small>No registered account matched this name.</small>
            </button>
          )}
        </div>
      )}

      <small
        className={`professor-status ${
          selected ? "registered" : trimmed ? "unregistered" : ""
        }`}
      >
        {status}
      </small>
    </div>
  )
}
