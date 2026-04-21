import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, spacing, typography, borderRadius, transitions, shadows } from '../../../lib/design-tokens';
import { Portal } from './Portal';

/**
 * Select Component Props
 */
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  searchable?: boolean;
  placeholder?: string;
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Elite Select Component
 * 
 * A premium dropdown component featuring:
 * - Portal-based rendering to prevent clipping
 * - Glassmorphism aesthetics (blur + translucency)
 * - Framer Motion animations
 * - Searchable filtering
 * - Full accessibility support
 */
export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      onChange,
      searchable = false,
      placeholder = 'Select an option',
      className = '',
      disabled = false,
      value,
      onOpenChange,
    },
    forwardedRef
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const internalId = React.useId();
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Sync external value
    useEffect(() => {
      if (value !== undefined) setSelectedValue(value as string);
    }, [value]);

    const filteredOptions = useMemo(() => {
      if (!searchQuery) return options;
      return options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [options, searchQuery]);

    const selectedLabel = useMemo(() => {
      const option = options.find(opt => opt.value === selectedValue);
      return option?.label || '';
    }, [options, selectedValue]);

    const updateCoords = useCallback(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, []);

    const toggleOpen = () => {
      if (disabled) return;
      const nextOpen = !isOpen;
      if (nextOpen) updateCoords();
      setIsOpen(nextOpen);
      onOpenChange?.(nextOpen);
      setSearchQuery('');
    };

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
      onOpenChange?.(false);
    };

    // Close on click outside and window resize/scroll
    useEffect(() => {
      if (!isOpen) return;

      const handleInteraction = (e: MouseEvent) => {
        const target = e.target as Node;
        const isTriggerClick = triggerRef.current && triggerRef.current.contains(target);
        const isMenuClick = menuRef.current && menuRef.current.contains(target);
        
        if (!isTriggerClick && !isMenuClick) {
          setIsOpen(false);
          onOpenChange?.(false);
        }
      };

      const handlePosChange = () => {
        if (isOpen) updateCoords();
      };

      window.addEventListener('mousedown', handleInteraction);
      window.addEventListener('resize', handlePosChange);
      window.addEventListener('scroll', handlePosChange, { passive: true });

      return () => {
        window.removeEventListener('mousedown', handleInteraction);
        window.removeEventListener('resize', handlePosChange);
        window.removeEventListener('scroll', handlePosChange);
      };
    }, [isOpen, updateCoords]);

    // Handle search focus
    useEffect(() => {
      if (isOpen && searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }, [isOpen, searchable]);

    // Styles
    const baseTriggerStyles: React.CSSProperties = {
      width: '100%',
      backgroundColor: colors.base[950],
      color: selectedValue ? colors.base[100] : colors.base[500],
      border: `1px solid ${error ? colors.danger[500] : colors.base[800]}`,
      borderRadius: borderRadius.md,
      padding: `${spacing[2]} ${spacing[4]}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: typography.fontSizes.sm,
      transition: `all ${transitions.base}`,
      outline: 'none',
      opacity: disabled ? 0.5 : 1,
      minHeight: '42px',
      position: 'relative',
    };

    const menuStyles: React.CSSProperties = {
      position: 'absolute',
      top: `${coords.top + 4}px`,
      left: `${coords.left}px`,
      width: `${coords.width}px`,
      backgroundColor: 'rgba(18, 18, 23, 0.85)',
      backdropFilter: 'blur(16px) saturate(180%)',
      border: `1px solid ${colors.base[800]}`,
      borderRadius: borderRadius.lg,
      boxShadow: shadows['2xl'],
      zIndex: 9999,
      overflow: 'hidden',
    };

    return (
      <div ref={forwardedRef} className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label className="text-[11px] font-bold text-base-500 uppercase tracking-widest px-1">
            {label}
          </label>
        )}

        <div 
          id={internalId}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          ref={triggerRef}
          style={baseTriggerStyles}
          onClick={toggleOpen}
          className={`group hover:border-base-600 ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <motion.svg 
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="w-4 h-4 text-base-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>

        {error && <span className="text-xs text-danger-500 px-1">{error}</span>}
        {hint && !error && <span className="text-xs text-base-500 px-1">{hint}</span>}

        <AnimatePresence>
          {isOpen && (
            <Portal>
              <motion.div
                key="select-menu"
                ref={menuRef}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={menuStyles}
              >
                {searchable && (
                  <div className="p-2 border-b border-base-800">
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="w-full bg-base-950/50 border border-base-800 rounded px-2 py-1.5 text-xs text-base-100 outline-none focus:border-primary/50"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHighlightedIndex(0);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                <ul
                  ref={listRef}
                  role="listbox"
                  aria-labelledby={internalId}
                  className="max-h-60 overflow-y-auto py-1 custom-scrollbar"
                >
                  {filteredOptions.length === 0 ? (
                    <li className="px-4 py-3 text-xs text-base-500 text-center italic">
                      No matches found
                    </li>
                  ) : (
                    filteredOptions.map((option, idx) => (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={option.value === selectedValue}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(option.value);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`
                          px-3 py-2 text-sm cursor-pointer transition-colors
                          ${option.value === selectedValue ? 'text-primary font-bold' : 'text-base-300'}
                          ${idx === highlightedIndex ? 'bg-primary/10' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {option.value === selectedValue && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>
            </Portal>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
