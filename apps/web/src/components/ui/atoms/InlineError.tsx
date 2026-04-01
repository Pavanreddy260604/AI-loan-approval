import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { designTokens } from '../../../lib/design-tokens';

export interface InlineErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  showIcon?: boolean;
}

/**
 * Elite v2 Inline Error
 * High-precision validation feedback with integrated iconography and semantic danger text.
 */
export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  showIcon = true,
  className = '',
  ...props
}) => {
  if (!message) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`flex items-start gap-1.5 px-1 py-0.5 ${className}`}
        {...(props as any)}
      >
        {showIcon && (
          <AlertCircle 
            size={12} 
            className="mt-0.5 shrink-0" 
            style={{ color: designTokens.colors.danger[500] }} 
          />
        )}
        <span 
          className="text-[10px] font-semibold leading-relaxed animate-shiver"
          style={{ color: designTokens.colors.danger[500] }}
        >
          {message}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};
