import React, { Component, ErrorInfo, ReactNode } from 'react';
import { colors, spacing, borderRadius, typography, transitions } from '../../../lib/design-tokens';

/**
 * ErrorBoundary Component Props
 * 
 * Molecular error boundary component following the design system specification.
 * Catches JavaScript errors anywhere in the child component tree and displays
 * a fallback UI with error message and recovery actions.
 * 
 * **Validates: Requirements 3.9, 8.1, 8.2, 8.3, 14.10**
 */
export interface ErrorBoundaryProps {
  /** Child components to monitor for errors */
  children: ReactNode;
  
  /** Custom fallback UI to display on error */
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** Custom error message to display */
  errorMessage?: string;
  
  /** Custom recovery button text */
  recoveryText?: string;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * ErrorBoundary Component State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * A React error boundary that catches JavaScript errors in child components,
 * logs the errors, and displays a fallback UI instead of crashing the component tree.
 * 
 * Must be implemented as a class component as error boundaries require
 * componentDidCatch lifecycle method.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary
 *   fallback={(error, errorInfo, reset) => (
 *     <div>
 *       <h2>Custom Error UI</h2>
 *       <button onClick={reset}>Try Again</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details and call onError callback
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    // @ts-ignore
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Reset error state to retry rendering
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render fallback UI when error occurs
   */
  renderFallback(): ReactNode {
    const { fallback, errorMessage, recoveryText, className } = this.props;
    const { error, errorInfo } = this.state;

    // Use custom fallback if provided
    if (fallback && error && errorInfo) {
      return fallback(error, errorInfo, this.resetError);
    }

    // Default fallback UI
    const containerStyles: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[8],
      minHeight: '400px',
      backgroundColor: colors.base[950],
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.danger[900]}`,
    };

    const iconStyles: React.CSSProperties = {
      fontSize: '48px',
      marginBottom: spacing[4],
    };

    const titleStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.h3,
      fontWeight: typography.fontWeights.semibold,
      color: colors.danger[500],
      marginBottom: spacing[2],
      textAlign: 'center',
    };

    const messageStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.base,
      color: colors.base[400],
      marginBottom: spacing[6],
      textAlign: 'center',
      maxWidth: '600px',
      lineHeight: typography.lineHeights.relaxed,
    };

    const buttonStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${spacing[3]} ${spacing[6]}`,
      backgroundColor: colors.primary[600],
      color: '#ffffff',
      border: 'none',
      borderRadius: borderRadius.md,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.medium,
      cursor: 'pointer',
      transition: `all ${transitions.base} ease-in-out`,
      outline: 'none',
    };

    const errorDetailsStyles: React.CSSProperties = {
      marginTop: spacing[6],
      padding: spacing[4],
      backgroundColor: colors.base[900],
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.base[800]}`,
      maxWidth: '800px',
      width: '100%',
      overflow: 'auto',
    };

    const errorTextStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.sm,
      color: colors.danger[400],
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      margin: 0,
    };

    const stackTraceStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.xs,
      color: colors.base[500],
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      marginTop: spacing[2],
    };

    return (
      <div className={className} style={containerStyles} role="alert">
        <div style={iconStyles}>⚠️</div>
        <h2 style={titleStyles}>Something went wrong</h2>
        <p style={messageStyles}>
          {errorMessage || 
            'An unexpected error occurred. Please try again or contact support if the problem persists.'}
        </p>
        <button
          onClick={this.resetError}
          style={buttonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary[700];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary[600];
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary[800];
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary[700];
          }}
        >
          {recoveryText || 'Try Again'}
        </button>

        {/* Show error details in development */}
        {/* @ts-ignore */}
        {process.env.NODE_ENV === 'development' && error && (
          <div style={errorDetailsStyles}>
            <p style={errorTextStyles}>
              <strong>Error:</strong> {error.toString()}
            </p>
            {errorInfo && errorInfo.componentStack && (
              <pre style={stackTraceStyles}>
                <strong>Component Stack:</strong>
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        )}
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
