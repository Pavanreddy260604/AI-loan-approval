import React from 'react';
import { colors, typography, borderRadius } from '../../../lib/design-tokens';
import { SkeletonLoader } from './SkeletonLoader';

/**
 * Avatar Component Props
 * 
 * Atomic avatar component following the design system specification.
 * Supports image display with fallback initials, size options, and loading state.
 * 
 * **Validates: Requirements 2.9, 14.3, 14.10**
 */
export interface AvatarProps {
  /** Image source URL */
  src?: string;
  
  /** Alt text for the image */
  alt?: string;
  
  /** Fallback initials to display when no image is provided or image fails to load */
  initials?: string;
  
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Loading state - shows skeleton loader */
  loading?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Avatar Component
 * 
 * A flexible avatar component for displaying user profile images with automatic
 * fallback to initials when no image is available. Supports multiple sizes and
 * loading states. Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="John Doe" initials="JD" size="md" />
 * <Avatar initials="AB" size="lg" />
 * <Avatar loading size="md" />
 * ```
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      initials,
      size = 'md',
      loading = false,
      className = '',
      style,
    },
    ref
  ) => {
    // Track image loading state
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);

    // Reset image state when src changes
    React.useEffect(() => {
      setImageLoaded(false);
      setImageError(false);
    }, [src]);

    // Determine if we should show the image
    const showImage = src && imageLoaded && !imageError && !loading;
    const showInitials = !showImage && !loading && initials;
    const showSkeleton = loading || (src && !imageLoaded && !imageError);

    // Base avatar styles
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      backgroundColor: colors.base[800],
      color: colors.base[300],
      fontWeight: typography.fontWeights.medium,
      overflow: 'hidden' as const,
      flexShrink: 0,
      position: 'relative' as const,
      userSelect: 'none' as const,
    };

    // Size styles
    const sizeStyles = {
      xs: {
        width: '24px',
        height: '24px',
        fontSize: typography.fontSizes.xs,
      },
      sm: {
        width: '32px',
        height: '32px',
        fontSize: typography.fontSizes.sm,
      },
      md: {
        width: '40px',
        height: '40px',
        fontSize: typography.fontSizes.base,
      },
      lg: {
        width: '48px',
        height: '48px',
        fontSize: typography.fontSizes.lg,
      },
      xl: {
        width: '64px',
        height: '64px',
        fontSize: typography.fontSizes.xl,
      },
    };

    // Image styles
    const imageStyles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: showImage ? 'block' : 'none',
    };

    // Combine styles
    const combinedStyles: React.CSSProperties = {
      ...baseStyles,
      ...sizeStyles[size],
      ...style,
    };

    // Handle image load
    const handleImageLoad = () => {
      setImageLoaded(true);
      setImageError(false);
    };

    // Handle image error
    const handleImageError = () => {
      setImageError(true);
      setImageLoaded(false);
    };

    return (
      <div
        ref={ref}
        className={className}
        style={combinedStyles}
        role="img"
        aria-label={alt}
      >
        {/* Image with lazy loading for performance (Req 13.8) */}
        {src && (
          <img
            src={src}
            alt={alt}
            style={imageStyles}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        {/* Skeleton loader */}
        {showSkeleton && (
          <SkeletonLoader 
            className="absolute inset-0" 
            variant="circle" 
            width="100%" 
            height="100%" 
          />
        )}

        {/* Fallback initials */}
        {showInitials && (
          <span style={{ lineHeight: 1 }}>
            {initials}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
