'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  className = '',
  menuClassName = '',
  align = 'left',
  variant = 'default', // 'default' (compact pill) | 'form' (full-width form control)
  fullWidth = false,
  direction = 'auto', // 'auto' | 'up' | 'down'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [placement, setPlacement] = useState(direction === 'up' ? 'up' : 'down')
  const containerRef = useRef(null)

  const isFormVariant = variant === 'form' || fullWidth || className.includes('w-full')

  // Normalisasi options agar bisa menerima array of strings atau array of objects
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value, label: opt.label }
    }
    return { value: opt, label: opt }
  })

  // Cari label untuk nilai yang sedang terpilih
  const selectedOption = normalizedOptions.find((opt) => opt.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  // Deteksi arah dropdown (up/down) saat dibuka jika direction === 'auto'
  useEffect(() => {
    if (!isOpen) return
    if (direction === 'up') {
      setPlacement('up')
      return
    }
    if (direction === 'down') {
      setPlacement('down')
      return
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      // Jika ruang di bawah kurang dari 220px dan ruang di atas lebih leluasa, buka ke atas
      if (spaceBelow < 220 && spaceAbove > spaceBelow) {
        setPlacement('up')
      } else {
        setPlacement('down')
      }
    }
  }, [isOpen, direction])

  const activePlacement = direction === 'up' ? 'up' : direction === 'down' ? 'down' : placement

  // Tutup dropdown saat klik di luar container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (optValue) => {
    onChange(optValue)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={`relative text-left ${isFormVariant ? 'w-full block' : 'inline-block'}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={
          isFormVariant
            ? `w-full h-11 px-3.5 text-sm rounded-xl border bg-white text-slate-900 flex items-center justify-between gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer ${
                isOpen
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              } ${className}`
            : `flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                isOpen ? 'bg-slate-100 ring-2 ring-emerald-500/20 border-slate-200' : ''
              } ${className}`
        }
      >
        <span className={`truncate ${!selectedOption && isFormVariant ? 'text-slate-400' : ''}`}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isFormVariant ? 'w-4 h-4' : 'w-3.5 h-3.5'
          } ${isOpen ? 'rotate-180 text-emerald-700' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 ${
            activePlacement === 'up'
              ? 'bottom-full mb-1.5 origin-bottom'
              : 'top-full mt-1.5 origin-top'
          } bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 max-h-60 overflow-y-auto animate-in fade-in duration-150 focus:outline-none ${
            isFormVariant
              ? 'w-full min-w-full left-0 right-0'
              : `min-w-[170px] w-full sm:w-auto ${align === 'right' ? 'right-0' : 'left-0'}`
          } ${menuClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3.5 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-3 cursor-pointer rounded-lg mx-1 my-0.5 ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
                style={{ width: 'calc(100% - 8px)' }}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
