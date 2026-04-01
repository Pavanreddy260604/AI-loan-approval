import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ 
  shouldThrow = true, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('Basic Rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });

    it('does not render fallback UI when no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('catches errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('displays default error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('displays custom error message', () => {
      render(
        <ErrorBoundary errorMessage="Custom error message">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('displays error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('displays "Something went wrong" title', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Recovery Action', () => {
    it('displays default recovery button text', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('displays custom recovery button text', () => {
      render(
        <ErrorBoundary recoveryText="Go Home">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('resets error state when recovery button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const button = screen.getByText('Try Again');
      button.click();

      // After reset, re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback UI', () => {
      const customFallback = () => <div>Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    });

    it('passes error to custom fallback', () => {
      const customFallback = (error: Error) => (
        <div>Error: {error.message}</div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError message="Custom error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error: Custom error message')).toBeInTheDocument();
    });

    it('passes reset function to custom fallback', () => {
      const customFallback = (_error: Error, _errorInfo: any, reset: () => void) => (
        <button onClick={reset}>Custom Reset</button>
      );

      const { rerender } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByText('Custom Reset');
      button.click();

      rerender(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Callback', () => {
    it('calls onError callback when error is caught', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('passes correct error to onError callback', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError message="Specific error" />
        </ErrorBoundary>
      );

      const [error] = onError.mock.calls[0];
      expect(error.message).toBe('Specific error');
    });

    it('does not call onError when no error occurs', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <div>No error</div>
        </ErrorBoundary>
      );

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="alert" on error UI', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('recovery button is keyboard accessible', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const button = screen.getByText('Try Again');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ErrorBoundary className="custom-error">
          <ThrowError />
        </ErrorBoundary>
      );

      const errorUI = container.querySelector('.custom-error');
      expect(errorUI).toBeInTheDocument();
    });

    it('applies correct background color', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorUI = container.querySelector('[role="alert"]') as HTMLElement;
      expect(errorUI.style.backgroundColor).toBeTruthy();
    });

    it('applies border radius', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorUI = container.querySelector('[role="alert"]') as HTMLElement;
      expect(errorUI.style.borderRadius).toBeTruthy();
    });
  });

  describe('Error Details in Development', () => {
    // @ts-ignore
    const originalEnv = (process as any).env.NODE_ENV;

    afterEach(() => {
      // @ts-ignore
      (process as any).env.NODE_ENV = originalEnv;
    });

    it('shows error details in development mode', () => {
      // @ts-ignore
      (process as any).env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError message="Development error" />
        </ErrorBoundary>
      );

      // Check that error details are shown (multiple "Error:" text is expected - one in label, one in content)
      expect(screen.getAllByText(/Error:/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Development error/)).toBeInTheDocument();
    });

    it('shows component stack in development mode', () => {
      // @ts-ignore
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Component Stack:/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles errors with empty message', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('handles multiple sequential errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError message="First error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Reset
      const button = screen.getByText('Try Again');
      button.click();

      // Throw another error
      rerender(
        <ErrorBoundary>
          <ThrowError message="Second error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('handles nested error boundaries', () => {
      render(
        <ErrorBoundary errorMessage="Outer boundary">
          <ErrorBoundary errorMessage="Inner boundary">
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText('Inner boundary')).toBeInTheDocument();
      expect(screen.queryByText('Outer boundary')).not.toBeInTheDocument();
    });

    it('handles errors in event handlers', () => {
      const BrokenButton: React.FC = () => (
        <button
          onClick={() => {
            throw new Error('Event handler error');
          }}
        >
          Click me
        </button>
      );

      render(
        <ErrorBoundary>
          <BrokenButton />
        </ErrorBoundary>
      );

      // Error boundaries don't catch errors in event handlers
      // Component should render normally
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('preserves children when no error', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Content 1</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <div>Content 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });
  });

  describe('Recovery Behavior', () => {
    it('clears error state on reset', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const button = screen.getByText('Try Again');
      button.click();

      rerender(
        <ErrorBoundary>
          <div>Recovered</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Recovered')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('allows retry after error', () => {
      let shouldThrow = true;

      const ConditionalError: React.FC = () => {
        if (shouldThrow) {
          throw new Error('Conditional error');
        }
        return <div>Success</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry
      const button = screen.getByText('Try Again');
      button.click();

      rerender(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
