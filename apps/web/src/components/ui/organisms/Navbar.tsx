import React from 'react';
import { colors, spacing, typography, borderRadius, transitions, shadows } from '../../../lib/design-tokens';
import { Avatar } from '../atoms/Avatar';
import { Dropdown, DropdownItem } from '../molecules/Dropdown';

/**
 * Navigation Link
 * 
 * Defines a navigation link in the navbar.
 */
export interface NavLink {
  /** Link label */
  label: string;
  
  /** Link href */
  href: string;
  
  /** Active state */
  active?: boolean;
  
  /** Click handler (overrides href navigation) */
  onClick?: () => void;
}

/**
 * User Menu Item
 * 
 * Defines a user menu dropdown item.
 */
export interface UserMenuItem extends DropdownItem {
  // Inherits from DropdownItem
}

/**
 * Navbar Component Props
 * 
 * Organism navbar component following the design system specification.
 * Provides top navigation with logo, navigation links, and user menu.
 * Includes mobile hamburger menu for responsive design.
 * 
 * **Validates: Requirements 4.6, 12.5, 14.10**
 */
export interface NavbarProps {
  /** Logo element or text */
  logo?: React.ReactNode;
  
  /** Logo click handler */
  onLogoClick?: () => void;
  
  /** Navigation links */
  links?: NavLink[];
  
  /** User name */
  userName?: string;
  
  /** User avatar URL */
  userAvatar?: string;
  
  /** User menu items */
  userMenuItems?: UserMenuItem[];
  
  /** User menu selection handler */
  onUserMenuSelect?: (value: string) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Navbar Component
 * 
 * A comprehensive navigation bar component with logo, navigation links, and user menu.
 * Includes mobile hamburger menu that collapses navigation on small screens.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Navbar
 *   logo={<img src="/logo.svg" alt="Logo" />}
 *   links={[
 *     { label: 'Dashboard', href: '/dashboard', active: true },
 *     { label: 'Datasets', href: '/datasets' },
 *     { label: 'Models', href: '/models' }
 *   ]}
 *   userName="John Doe"
 *   userAvatar="/avatar.jpg"
 *   userMenuItems={[
 *     { label: 'Profile', value: 'profile' },
 *     { label: 'Settings', value: 'settings' },
 *     { label: 'Logout', value: 'logout', danger: true }
 *   ]}
 *   onUserMenuSelect={handleUserMenuSelect}
 * />
 * ```
 */
export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      logo,
      onLogoClick,
      links = [],
      userName,
      userAvatar,
      userMenuItems = [],
      onUserMenuSelect,
      className = '',
    },
    ref
  ) => {
    // Mobile menu state
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    // Close mobile menu when window is resized to desktop
    React.useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 768 && mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [mobileMenuOpen]);

    // Navbar container styles
    const navbarStyles: React.CSSProperties = {
      width: '100%',
      backgroundColor: colors.base[950],
      borderBottom: `1px solid ${colors.base[800]}`,
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: shadows.sm,
    };

    // Inner container styles
    const containerStyles: React.CSSProperties = {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: `${spacing[4]} ${spacing[6]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    };

    // Logo styles
    const logoStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      fontSize: typography.fontSizes.xl,
      fontWeight: typography.fontWeights.bold,
      color: colors.base[100],
      cursor: onLogoClick ? 'pointer' : 'default',
      textDecoration: 'none',
    };

    // Desktop nav links container
    const desktopLinksStyles: React.CSSProperties = {
      display: 'none',
      gap: spacing[2],
      alignItems: 'center',
    };

    // Nav link styles
    const getLinkStyles = (active: boolean): React.CSSProperties => ({
      padding: `${spacing[2]} ${spacing[4]}`,
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
    });

    // User section styles
    const userSectionStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
    };

    // Mobile menu button styles
    const mobileMenuButtonStyles: React.CSSProperties = {
      display: 'flex',
      padding: spacing[2],
      color: colors.base[300],
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      transition: `background-color ${transitions.base}`,
    };

    // Mobile menu container styles
    const mobileMenuStyles: React.CSSProperties = {
      display: mobileMenuOpen ? 'flex' : 'none',
      flexDirection: 'column',
      gap: spacing[2],
      padding: spacing[4],
      backgroundColor: colors.base[900],
      borderTop: `1px solid ${colors.base[800]}`,
    };

    // Hamburger icon
    const HamburgerIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );

    // Close icon
    const CloseIcon = () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );

    return (
      <nav ref={ref} className={className} style={navbarStyles}>
        <div style={containerStyles}>
          {/* Logo */}
          <div style={logoStyles} onClick={onLogoClick}>
            {logo || 'Logo'}
          </div>

          {/* Desktop Navigation Links */}
          <div style={desktopLinksStyles} className="desktop-nav">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                style={getLinkStyles(link.active || false)}
                onClick={(e) => {
                  if (link.onClick) {
                    e.preventDefault();
                    link.onClick();
                  }
                }}
                onMouseEnter={(e) => {
                  if (!link.active) {
                    e.currentTarget.style.backgroundColor = colors.base[900];
                  }
                }}
                onMouseLeave={(e) => {
                  if (!link.active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Section */}
          <div style={userSectionStyles}>
            {/* User Menu (Desktop) */}
            {userName && userMenuItems.length > 0 && (
              <div className="desktop-user-menu" style={{ display: 'none' }}>
                <Dropdown
                  trigger={
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], cursor: 'pointer' }}>
                      <Avatar
                        src={userAvatar}
                        alt={userName}
                        initials={userName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        size="sm"
                      />
                      <span style={{ fontSize: typography.fontSizes.sm, color: colors.base[300] }}>
                        {userName}
                      </span>
                    </div>
                  }
                  items={userMenuItems}
                  onSelect={onUserMenuSelect || (() => {})}
                  placement="bottom-end"
                />
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-button"
              style={mobileMenuButtonStyles}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div style={mobileMenuStyles}>
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              style={getLinkStyles(link.active || false)}
              onClick={(e) => {
                if (link.onClick) {
                  e.preventDefault();
                  link.onClick();
                }
                setMobileMenuOpen(false);
              }}
            >
              {link.label}
            </a>
          ))}
          
          {userName && userMenuItems.length > 0 && (
            <>
              <div style={{ height: '1px', backgroundColor: colors.base[800], margin: `${spacing[2]} 0` }} />
              {userMenuItems.map((item, index) => (
                <button
                  key={index}
                  style={{
                    ...getLinkStyles(false),
                    width: '100%',
                    textAlign: 'left',
                    color: item.danger ? colors.danger[400] : colors.base[300],
                  }}
                  onClick={() => {
                    onUserMenuSelect?.(item.value);
                    setMobileMenuOpen(false);
                  }}
                  disabled={item.disabled}
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* CSS for responsive behavior */}
        <style>{`
          @media (min-width: 768px) {
            .desktop-nav {
              display: flex !important;
            }
            .desktop-user-menu {
              display: block !important;
            }
            .mobile-menu-button {
              display: none !important;
            }
          }
        `}</style>
      </nav>
    );
  }
);

Navbar.displayName = 'Navbar';

export default Navbar;
