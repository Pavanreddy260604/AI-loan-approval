import React from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../../lib/design-tokens';


/**
 * Sidebar Navigation Item
 * 
 * Defines a navigation item in the sidebar.
 */
export interface SidebarItem {
  /** Item label */
  label: string;
  
  /** Item icon */
  icon?: React.ReactNode;
  
  /** Item href */
  href?: string;
  
  /** Active state */
  active?: boolean;
  
  /** Click handler (overrides href navigation) */
  onClick?: () => void;
  
  /** Badge content (e.g., notification count) */
  badge?: string | number;
}

/**
 * Sidebar Component Props
 * 
 * Organism sidebar component following the design system specification.
 * Provides collapsible side navigation with active state indicators.
 * Includes collapse/expand animation and responsive behavior.
 * 
 * **Validates: Requirements 4.7, 12.5, 14.10**
 */
export interface SidebarProps {
  /** Navigation items */
  items: SidebarItem[];
  
  /** Collapsed state */
  collapsed?: boolean;
  
  /** Collapse toggle handler */
  onToggleCollapse?: () => void;
  
  /** Header content (logo, title) */
  header?: React.ReactNode;
  
  /** Footer content */
  footer?: React.ReactNode;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sidebar Component
 * 
 * A collapsible sidebar navigation component with active state indicators,
 * collapse/expand animation, and responsive behavior (collapses on mobile).
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Sidebar
 *   items={[
 *     { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard', active: true },
 *     { label: 'Datasets', icon: <DataIcon />, href: '/datasets', badge: 5 },
 *     { label: 'Models', icon: <ModelIcon />, href: '/models' }
 *   ]}
 *   collapsed={isCollapsed}
 *   onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
 *   header={<Logo />}
 * />
 * ```
 */
export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      items,
      collapsed = false,
      onToggleCollapse,
      header,
      footer,
      className = '',
    },
    ref
  ) => {
    // Sidebar container styles
    const sidebarStyles: React.CSSProperties = {
      width: collapsed ? '64px' : '240px',
      height: '100vh',
      backgroundColor: colors.base[950],
      borderRight: `1px solid ${colors.base[800]}`,
      display: 'flex',
      flexDirection: 'column',
      transition: `width ${transitions.slow} ease-in-out`,
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 30,
      overflowX: 'hidden',
    };

    // Header styles
    const headerStyles: React.CSSProperties = {
      padding: spacing[4],
      borderBottom: `1px solid ${colors.base[800]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'space-between',
      minHeight: '64px',
    };

    // Navigation container styles
    const navStyles: React.CSSProperties = {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: spacing[2],
    };

    // Nav item styles
    const getItemStyles = (active: boolean): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      padding: `${spacing[3]} ${spacing[3]}`,
      marginBottom: spacing[1],
      fontSize: typography.fontSizes.base,
      fontWeight: active ? typography.fontWeights.semibold : typography.fontWeights.normal,
      color: active ? colors.primary[400] : colors.base[300],
      textDecoration: 'none',
      borderRadius: borderRadius.md,
      transition: `all ${transitions.base}`,
      cursor: 'pointer',
      backgroundColor: active ? `${colors.primary[600]}10` : 'transparent',
      border: 'none',
      fontFamily: 'inherit',
      width: '100%',
      textAlign: 'left',
      position: 'relative',
      whiteSpace: 'nowrap',
    });

    // Icon container styles
    const iconContainerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '20px',
      color: 'inherit',
    };

    // Label styles
    const labelStyles: React.CSSProperties = {
      flex: 1,
      opacity: collapsed ? 0 : 1,
      transition: `opacity ${transitions.base}`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };

    // Badge styles
    const badgeStyles: React.CSSProperties = {
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: typography.fontSizes.xs,
      fontWeight: typography.fontWeights.semibold,
      color: colors.base[100],
      backgroundColor: colors.primary[600],
      borderRadius: borderRadius.full,
      minWidth: '20px',
      textAlign: 'center',
      opacity: collapsed ? 0 : 1,
      transition: `opacity ${transitions.base}`,
    };

    // Footer styles
    const footerStyles: React.CSSProperties = {
      padding: spacing[4],
      borderTop: `1px solid ${colors.base[800]}`,
    };

    // Toggle button styles
    const toggleButtonStyles: React.CSSProperties = {
      padding: spacing[2],
      color: colors.base[400],
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      transition: `all ${transitions.base}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Chevron icon
    const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: direction === 'left' ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: `transform ${transitions.base}`,
        }}
      >
        <path
          d="M12 4L6 10L12 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

    return (
      <aside ref={ref} className={className} style={sidebarStyles}>
        {/* Header */}
        {(header || onToggleCollapse) && (
          <div style={headerStyles}>
            {!collapsed && header && <div style={{ flex: 1 }}>{header}</div>}
            {onToggleCollapse && (
              <button
                style={toggleButtonStyles}
                onClick={onToggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.base[900];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ChevronIcon direction={collapsed ? 'right' : 'left'} />
              </button>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav style={navStyles}>
          {items.map((item, index) => {
            const ItemTag = item.href ? 'a' : 'button';
            
            return (
              <ItemTag
                key={index}
                href={item.href}
                style={getItemStyles(item.active || false)}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = colors.base[900];
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                {item.icon && (
                  <span style={iconContainerStyles}>
                    {item.icon}
                  </span>
                )}
                <span style={labelStyles}>
                  {item.label}
                </span>
                {item.badge && (
                  <span style={badgeStyles}>
                    {item.badge}
                  </span>
                )}
              </ItemTag>
            );
          })}
        </nav>

        {/* Footer */}
        {footer && !collapsed && (
          <div style={footerStyles}>
            {footer}
          </div>
        )}

        {/* CSS for responsive behavior */}
        <style>{`
          @media (max-width: 768px) {
            aside {
              transform: ${collapsed ? 'translateX(-100%)' : 'translateX(0)'};
            }
          }
        `}</style>
      </aside>
    );
  }
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;
