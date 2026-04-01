import React, { useEffect, useRef, useState, useCallback } from 'react';
import { colors, spacing, borderRadius, shadows, transitions, typography } from '../../../lib/design-tokens';

/**
 * Dropdown Item Interface
 * 
 * Defines the structure of a single dropdown menu item.
 */
export interface DropdownItem {
  /** Display label */
  label: string;
  
  /** Unique value identifier */
  value: string;
  
  /** Optional icon element */
  icon?: React.ReactNode;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Danger variant for destructive actions */
  danger?: boolean;
}

/**
 * Dropdown Component Props
 * 
 * Molecular dropdown component following the design system specification.
 * Supports menu items with keyboard navigation, placement options, and height expansion animation.
 * 
 * **Validates: Requirements 3.4, 10.6, 11.2, 14.10**
 */
export interface DropdownProps {
  /** Trigger element */
  trigger: React.ReactNode;
  
  /** Menu items */
  items: DropdownItem[];
  
  /** Item selection handler */
  onSelect: (value: string) => void;
  
  /** Placement */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Custom hook for click outside detection
 * 
 * Detects clicks outside the dropdown to close it.
 */
const useClickOutside = (
  ref: React.RefObject<HTMLDivElement>,
  handler: () => void,
  isOpen: boolean
) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    // Add a small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, isOpen]);
};

/**
 * Custom hook for keyboard navigation
 * 
 * Handles Arrow Up/Down, Enter, and Escape keys for menu navigation.
 */
const useKeyboardNavigation = (
  isOpen: boolean,
  items: DropdownItem[],
  onSelect: (value: string) => void,
  onClose: () => void
) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const enabledIndices = items
        .map((item, index) => (!item.disabled ? index : -1))
        .filter(index => index !== -1);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => {
            if (prev === -1) return enabledIndices[0] ?? -1;
            const currentPos = enabledIndices.indexOf(prev);
            const nextPos = (currentPos + 1) % enabledIndices.length;
            return enabledIndices[nextPos] ?? -1;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => {
            if (prev === -1) return enabledIndices[enabledIndices.length - 1] ?? -1;
            const currentPos = enabledIndices.indexOf(prev);
            const prevPos = currentPos === 0 ? enabledIndices.length - 1 : currentPos - 1;
            return enabledIndices[prevPos] ?? -1;
          });
          break;

        case 'Enter':
          e.preventDefault();
          if (focusedIndex !== -1 && !items[focusedIndex].disabled) {
            onSelect(items[focusedIndex].value);
            onClose();
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, focusedIndex, onSelect, onClose]);

  return focusedIndex;
};

/**
 * Dropdown Component
 * 
 * A flexible dropdown menu component with keyboard navigation, placement options,
 * and height expansion animation. Supports icons, disabled items, and danger variants.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button>Actions</Button>}
 *   items={[
 *     { label: 'Edit', value: 'edit', icon: <Edit /> },
 *     { label: 'Delete', value: 'delete', icon: <Trash />, danger: true }
 *   ]}
 *   onSelect={handleAction}
 *   placement="bottom-start"
 * />
 * ```
 */
export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      trigger,
      items,
      onSelect,
      placement = 'bottom-start',
      className = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuHeight, setMenuHeight] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || dropdownRef;

    // Click outside to close
    useClickOutside(combinedRef, () => setIsOpen(false), isOpen);

    // Keyboard navigation
    const focusedIndex = useKeyboardNavigation(
      isOpen,
      items,
      onSelect,
      () => setIsOpen(false)
    );

    // Measure menu height for animation
    useEffect(() => {
      if (isOpen && menuRef.current) {
        const height = menuRef.current.scrollHeight;
        setMenuHeight(height);
      } else {
        setMenuHeight(0);
      }
    }, [isOpen, items]);

    // Handle item selection
    const handleSelect = useCallback(
      (value: string, disabled: boolean) => {
        if (disabled) return;
        onSelect(value);
        setIsOpen(false);
      },
      [onSelect]
    );

    // Toggle dropdown
    const handleToggle = useCallback(() => {
      setIsOpen(prev => !prev);
    }, []);

    // Placement styles
    const placementStyles: Record<string, React.CSSProperties> = {
      'bottom-start': {
        top: '100%',
        left: 0,
        marginTop: spacing[1],
      },
      'bottom-end': {
        top: '100%',
        right: 0,
        marginTop: spacing[1],
      },
      'top-start': {
        bottom: '100%',
        left: 0,
        marginBottom: spacing[1],
      },
      'top-end': {
        bottom: '100%',
        right: 0,
        marginBottom: spacing[1],
      },
    };

    // Container styles
    const containerStyles: React.CSSProperties = {
      position: 'relative',
      display: 'inline-block',
    };

    // Menu container styles
    const menuContainerStyles: React.CSSProperties = {
      position: 'absolute',
      zIndex: 1000,
      minWidth: '200px',
      ...placementStyles[placement],
    };

    // Menu styles with height animation
    const menuStyles: React.CSSProperties = {
      backgroundColor: colors.base[900],
      border: `1px solid ${colors.base[800]}`,
      borderRadius: borderRadius.md,
      boxShadow: shadows.lg,
      overflow: 'hidden',
      transition: `height ${transitions.base} ease-in-out, opacity ${transitions.base} ease-in-out`,
      height: isOpen ? `${menuHeight}px` : '0px',
      opacity: isOpen ? 1 : 0,
    };

    // Menu inner wrapper (for measuring height)
    const menuInnerStyles: React.CSSProperties = {
      padding: spacing[1],
    };

    // Menu item base styles
    const getItemStyles = (
      item: DropdownItem,
      index: number,
      isHovered: boolean
    ): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: spacing[2],
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.medium,
      color: item.disabled
        ? colors.base[600]
        : item.danger
        ? colors.danger[500]
        : colors.base[200],
      backgroundColor:
        focusedIndex === index || isHovered
          ? colors.base[800]
          : 'transparent',
      borderRadius: borderRadius.sm,
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      transition: `all ${transitions.fast} ease-in-out`,
      userSelect: 'none',
      outline: 'none',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      fontFamily: 'inherit',
      lineHeight: typography.lineHeights.normal,
      opacity: item.disabled ? 0.5 : 1,
    });

    // Icon wrapper styles
    const iconStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '16px',
      height: '16px',
      flexShrink: 0,
    };

    return (
      <div
        ref={combinedRef}
        className={className}
        style={containerStyles}
      >
        {/* Trigger */}
        <div onClick={handleToggle} style={{ cursor: 'pointer' }}>
          {trigger}
        </div>

        {/* Menu */}
        <div style={menuContainerStyles}>
          <div style={menuStyles}>
            <div ref={menuRef} style={menuInnerStyles}>
              {items.map((item, index) => (
                <DropdownMenuItem
                  key={item.value}
                  item={item}
                  index={index}
                  onSelect={handleSelect}
                  getItemStyles={getItemStyles}
                  iconStyles={iconStyles}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

/**
 * Dropdown Menu Item Component
 * 
 * Individual menu item with hover state management.
 */
interface DropdownMenuItemProps {
  item: DropdownItem;
  index: number;
  onSelect: (value: string, disabled: boolean) => void;
  getItemStyles: (item: DropdownItem, index: number, isHovered: boolean) => React.CSSProperties;
  iconStyles: React.CSSProperties;
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  item,
  index,
  onSelect,
  getItemStyles,
  iconStyles,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(item.value, item.disabled ?? false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={getItemStyles(item, index, isHovered)}
      disabled={item.disabled}
      aria-disabled={item.disabled}
    >
      {item.icon && <span style={iconStyles}>{item.icon}</span>}
      <span>{item.label}</span>
    </button>
  );
};

Dropdown.displayName = 'Dropdown';

export default Dropdown;
