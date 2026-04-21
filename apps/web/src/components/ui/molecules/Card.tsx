import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Banking Card Component
 * 
 * Double-Bezel (Doppelrand) architecture for machined hardware aesthetic.
 * Outer shell + inner core with concentric curves and hairline precision.
 */
export interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  padded?: boolean;
  border?: boolean; // Deprecated: kept for backward compatibility
  className?: string;
  variant?: 'default' | 'elevated' | 'glass';
}

export const Card = React.memo(React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      header,
      footer,
      hoverable = false,
      padded = true,
      border: _border, // Deprecated but accepted for backward compatibility
      className = '',
      variant = 'default',
    },
    ref
  ) => {
    // Variant-specific shell styling - uses CSS variables for theming
    const shellStyles = {
      default: '',
      elevated: 'shadow-lg',
      glass: 'backdrop-blur-xl',
    };

    const headerClasses = padded
      ? 'px-5 py-3.5 border-b'
      : 'border-b';

    const bodyClasses = padded ? 'p-5 flex-1' : 'flex-1';

    const footerClasses = padded
      ? 'px-5 py-3.5 border-t'
      : 'border-t';

    return (
      <motion.div
        ref={ref as any}
        style={{
          padding: '3px',
          borderRadius: '20px',
          backgroundColor: variant === 'glass' ? 'rgba(255,255,255,0.1)' : 'var(--card-shell-bg)',
          boxShadow: shellStyles[variant],
          '--tw-ring-color': 'var(--card-shell-ring)',
        } as React.CSSProperties}
        className={[
          'ring-1',
          className,
        ].join(' ')}
        data-card-shell
        whileHover={hoverable ? {
          y: -2,
          transition: { type: 'spring', stiffness: 500, damping: 35 }
        } : {}}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Inner Core - Machined Content Container */}
        <div
          style={{
            borderRadius: '17px',
            backgroundColor: variant === 'glass' ? 'rgba(255,255,255,0.8)' : 'var(--card-core-bg)',
            boxShadow: 'inset 0 1px 1px var(--card-core-shadow-inset)',
          }}
          className="flex flex-col overflow-hidden"
        >
          {header ? <div className={headerClasses} style={{ borderColor: 'var(--card-border)' }}>{header}</div> : null}
          <div className={bodyClasses}>{children}</div>
          {footer ? <div className={footerClasses} style={{ borderColor: 'var(--card-border)' }}>{footer}</div> : null}
        </div>
      </motion.div>
    );
  }
));

Card.displayName = 'Card';

/**
 * Premium Banking Card Shell
 * 
 * Use for wrapping multiple related cards or creating distinct content zones
 * with the machined Double-Bezel aesthetic.
 */
export const CardShell: React.FC<{
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}> = ({ children, className = '', glow = false }) => (
  <div
    style={{
      padding: '4px',
      borderRadius: '24px',
      background: 'linear-gradient(to bottom, var(--card-shell-bg), rgba(0,0,0,0.02))',
      boxShadow: glow ? '0 0 60px -12px rgba(59,130,246,0.15)' : undefined,
    }}
    className={['ring-1', className].join(' ')}
    data-card-shell
  >
    <div
      style={{
        backgroundColor: 'var(--card-core-bg)',
        borderRadius: '20px',
        boxShadow: 'inset 0 1px 2px var(--card-core-shadow-inset)',
      }}
    >
      {children}
    </div>
  </div>
);

export default Card;
