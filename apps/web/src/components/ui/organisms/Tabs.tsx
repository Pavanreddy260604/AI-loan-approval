import React from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../../lib/design-tokens';

/**
 * Tab Item
 * 
 * Defines a tab in the tabs component.
 */
export interface TabItem {
  /** Tab label */
  label: string;
  
  /** Tab content */
  content: React.ReactNode;
  
  /** Tab icon */
  icon?: React.ReactNode;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Unique key */
  key?: string;
}

/**
 * Tabs Component Props
 * 
 * Organism tabs component following the design system specification.
 * Provides content switching with keyboard navigation and active tab indicator animation.
 * 
 * **Validates: Requirements 4.8, 11.2, 14.10**
 */
export interface TabsProps {
  /** Tab items */
  items: TabItem[];
  
  /** Active tab index */
  activeTab?: number;
  
  /** Tab change handler */
  onTabChange?: (index: number) => void;
  
  /** Variant style */
  variant?: 'line' | 'enclosed';
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tabs Component
 * 
 * A comprehensive tabs component for content switching with keyboard navigation
 * (Arrow keys) and active tab indicator with smooth animation.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Tabs
 *   items={[
 *     { label: 'Overview', content: <OverviewPanel /> },
 *     { label: 'Details', content: <DetailsPanel /> },
 *     { label: 'History', content: <HistoryPanel /> }
 *   ]}
 *   activeTab={currentTab}
 *   onTabChange={setCurrentTab}
 * />
 * ```
 */
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      items,
      activeTab = 0,
      onTabChange,
      variant = 'line',
      className = '',
    },
    ref
  ) => {
    // Internal state for controlled/uncontrolled behavior
    const [internalActiveTab, setInternalActiveTab] = React.useState(activeTab);
    const currentTab = onTabChange ? activeTab : internalActiveTab;

    // Refs for tab buttons
    const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
    const indicatorRef = React.useRef<HTMLDivElement>(null);

    // Update indicator position
    const updateIndicator = React.useCallback(() => {
      if (variant === 'line' && indicatorRef.current && tabRefs.current[currentTab]) {
        const activeTabElement = tabRefs.current[currentTab];
        if (activeTabElement) {
          const { offsetLeft, offsetWidth } = activeTabElement;
          indicatorRef.current.style.left = `${offsetLeft}px`;
          indicatorRef.current.style.width = `${offsetWidth}px`;
        }
      }
    }, [currentTab, variant]);

    // Update indicator on mount and when active tab changes
    React.useEffect(() => {
      updateIndicator();
    }, [updateIndicator]);

    // Update indicator on window resize
    React.useEffect(() => {
      window.addEventListener('resize', updateIndicator);
      return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);

    // Handle tab change
    const handleTabChange = (index: number) => {
      if (items[index].disabled) return;
      
      if (onTabChange) {
        onTabChange(index);
      } else {
        setInternalActiveTab(index);
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = index > 0 ? index - 1 : items.length - 1;
          // Skip disabled tabs
          while (items[newIndex].disabled && newIndex !== index) {
            newIndex = newIndex > 0 ? newIndex - 1 : items.length - 1;
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = index < items.length - 1 ? index + 1 : 0;
          // Skip disabled tabs
          while (items[newIndex].disabled && newIndex !== index) {
            newIndex = newIndex < items.length - 1 ? newIndex + 1 : 0;
          }
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          // Skip disabled tabs
          while (items[newIndex].disabled && newIndex < items.length - 1) {
            newIndex++;
          }
          break;
        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          // Skip disabled tabs
          while (items[newIndex].disabled && newIndex > 0) {
            newIndex--;
          }
          break;
        default:
          return;
      }

      if (newIndex !== index && !items[newIndex].disabled) {
        handleTabChange(newIndex);
        tabRefs.current[newIndex]?.focus();
      }
    };

    // Container styles
    const containerStyles: React.CSSProperties = {
      width: '100%',
    };

    // Tab list container styles
    const tabListStyles: React.CSSProperties = {
      display: 'flex',
      position: 'relative',
      borderBottom: variant === 'line' ? `2px solid ${colors.base[800]}` : 'none',
      gap: variant === 'enclosed' ? spacing[2] : 0,
    };

    // Tab button styles
    const getTabButtonStyles = (index: number): React.CSSProperties => {
      const isActive = index === currentTab;
      const isDisabled = items[index].disabled;

      const baseStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: spacing[2],
        padding: `${spacing[3]} ${spacing[4]}`,
        fontSize: typography.fontSizes.base,
        fontWeight: isActive ? typography.fontWeights.semibold : typography.fontWeights.normal,
        color: isDisabled ? colors.base[600] : isActive ? colors.primary[400] : colors.base[300],
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: variant === 'enclosed' ? `${borderRadius.md} ${borderRadius.md} 0 0` : 0,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: `all ${transitions.base}`,
        position: 'relative',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        outline: 'none',
      };

      if (variant === 'enclosed') {
        return {
          ...baseStyles,
          backgroundColor: isActive ? colors.base[950] : colors.base[900],
          border: `1px solid ${colors.base[800]}`,
          borderBottom: isActive ? `1px solid ${colors.base[950]}` : `1px solid ${colors.base[800]}`,
          marginBottom: '-1px',
        };
      }

      return baseStyles;
    };

    // Active indicator styles (for line variant)
    const indicatorStyles: React.CSSProperties = {
      position: 'absolute',
      bottom: '-2px',
      height: '2px',
      backgroundColor: colors.primary[600],
      transition: `all ${transitions.base} ease-in-out`,
      pointerEvents: 'none',
    };

    // Content container styles
    const contentStyles: React.CSSProperties = {
      padding: `${spacing[6]} 0`,
    };

    return (
      <div ref={ref} className={className} style={containerStyles}>
        {/* Tab List */}
        <div
          role="tablist"
          style={tabListStyles}
          aria-label="Tabs"
        >
          {items.map((item, index) => {
            const tabKey = item.key || `tab-${index}`;
            const isActive = index === currentTab;

            return (
              <button
                key={tabKey}
                ref={(el) => { tabRefs.current[index] = el; }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tabKey}`}
                id={`tab-${tabKey}`}
                tabIndex={isActive ? 0 : -1}
                disabled={item.disabled}
                style={getTabButtonStyles(index)}
                onClick={() => handleTabChange(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onMouseEnter={(e) => {
                  if (!isActive && !item.disabled) {
                    e.currentTarget.style.color = colors.base[100];
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !item.disabled) {
                    e.currentTarget.style.color = colors.base[300];
                  }
                }}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Active Indicator (line variant only) */}
          {variant === 'line' && (
            <div
              ref={indicatorRef}
              style={indicatorStyles}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Tab Panels */}
        {items.map((item, index) => {
          const tabKey = item.key || `tab-${index}`;
          const isActive = index === currentTab;

          return (
            <div
              key={tabKey}
              role="tabpanel"
              id={`tabpanel-${tabKey}`}
              aria-labelledby={`tab-${tabKey}`}
              hidden={!isActive}
              style={contentStyles}
            >
              {isActive && item.content}
            </div>
          );
        })}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export default Tabs;
