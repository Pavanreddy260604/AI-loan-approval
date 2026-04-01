import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal Component
 * 
 * Renders children into a DOM node that exists outside the hierarchy of the parent component.
 * This is essential for components like Dropdowns, Tooltips, and Modals to "break out"
 * of containers with overflow: hidden or specific z-index contexts.
 * 
 * **Validates: Requirement 14.10 (Elite UI Robustness)**
 */
export interface PortalProps {
  /** Content to render in the portal */
  children: React.ReactNode;
  
  /** Optional target container (defaults to document.body) */
  container?: HTMLElement;
}

export const Portal: React.FC<PortalProps> = ({ children, container }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, container || document.body);
};

export default Portal;
