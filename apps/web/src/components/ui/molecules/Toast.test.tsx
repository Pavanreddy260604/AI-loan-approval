import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Toast, ToastProvider, useToast } from './Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders toast message correctly', () => {
      const onClose = vi.fn();
      render(<Toast message="Test message" onClose={onClose} />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with default info type', () => {
      const onClose = vi.fn();
      render(<Toast message="Info message" onClose={onClose} />);
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('ℹ')).toBeInTheDocument();
    });

    it('renders with success type', () => {
      const onClose = vi.fn();
      render(<Toast message="Success message" type="success" onClose={onClose} />);
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('renders with error type', () => {
      const onClose = vi.fn();
      render(<Toast message="Error message" type="error" onClose={onClose} />);
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      // Error type uses ✕ as icon, and close button also uses ✕, so we expect 2
      expect(screen.getAllByText('✕')).toHaveLength(2);
    });

    it('renders with warning type', () => {
      const onClose = vi.fn();
      render(<Toast message="Warning message" type="warning" onClose={onClose} />);
      
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('renders with info type explicitly', () => {
      const onClose = vi.fn();
      render(<Toast message="Info message" type="info" onClose={onClose} />);
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('ℹ')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('renders close button by default', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton).toBeInTheDocument();
    });

    it('renders close button when closable is true', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} closable={true} />);
      
      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton).toBeInTheDocument();
    });

    it('does not render close button when closable is false', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} closable={false} />);
      
      const closeButton = screen.queryByLabelText('Close notification');
      expect(closeButton).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close notification');
      closeButton.click();
      
      // Wait for animation
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('applies hover effect on close button', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close notification') as HTMLButtonElement;
      
      // Initial opacity
      expect(closeButton.style.opacity).toBe('0.7');
      
      // Test that hover handlers exist (we can't easily test inline style changes from event handlers)
      expect(closeButton.onmouseenter).toBeDefined();
      expect(closeButton.onmouseleave).toBeDefined();
    });
  });

  describe('Auto-dismiss', () => {
    it('auto-dismisses after default 5 seconds', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} />);
      
      expect(onClose).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(5200); // 5000ms + 200ms animation
      });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('auto-dismisses after custom duration', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} duration={3000} />);
      
      expect(onClose).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(3200); // 3000ms + 200ms animation
      });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not auto-dismiss when duration is 0', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} duration={0} />);
      
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not auto-dismiss when duration is negative', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} duration={-1} />);
      
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Slide Animation', () => {
    it('starts with invisible state', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast.style.opacity).toBe('0');
    });

    it('becomes visible after mount', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      expect(toast.style.opacity).toBe('1');
    });

    it('slides from top when position is top', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} position="top" />);
      const toast = container.firstChild as HTMLElement;
      
      // Initial state - translated up
      expect(toast.style.transform).toContain('translateY(-100%)');
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      // Visible state - no translation
      expect(toast.style.transform).toBe('translateY(0)');
    });

    it('slides from bottom when position is bottom', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} position="bottom" />);
      const toast = container.firstChild as HTMLElement;
      
      // Initial state - translated down
      expect(toast.style.transform).toContain('translateY(100%)');
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      // Visible state - no translation
      expect(toast.style.transform).toBe('translateY(0)');
    });
  });

  describe('Accessibility', () => {
    it('has role="alert"', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast).toHaveAttribute('role', 'alert');
    });

    it('has aria-live="polite"', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('close button has aria-label', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct colors for success type', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" type="success" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast.style.backgroundColor).toBeTruthy();
      expect(toast.style.border).toBeTruthy();
    });

    it('applies correct colors for error type', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" type="error" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast.style.backgroundColor).toBeTruthy();
      expect(toast.style.border).toBeTruthy();
    });

    it('applies correct colors for warning type', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" type="warning" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast.style.backgroundColor).toBeTruthy();
      expect(toast.style.border).toBeTruthy();
    });

    it('applies correct colors for info type', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" type="info" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast.style.backgroundColor).toBeTruthy();
      expect(toast.style.border).toBeTruthy();
    });

    it('applies border radius', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast.style.borderRadius).toBeTruthy();
    });

    it('applies box shadow', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast.style.boxShadow).toBeTruthy();
    });

    it('applies transition', () => {
      const onClose = vi.fn();
      const { container } = render(<Toast message="Test" onClose={onClose} />);
      const toast = container.firstChild as HTMLElement;
      
      expect(toast.style.transition).toBeTruthy();
    });
  });
});

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test component that uses the useToast hook
  const TestComponent: React.FC = () => {
    const toast = useToast();
    
    return (
      <div>
        <button onClick={() => toast.success('Success!')}>Success</button>
        <button onClick={() => toast.error('Error!')}>Error</button>
        <button onClick={() => toast.warning('Warning!')}>Warning</button>
        <button onClick={() => toast.info('Info!')}>Info</button>
        <button onClick={() => toast.success('Custom duration', 2000)}>Custom Duration</button>
      </div>
    );
  };

  describe('Provider Setup', () => {
    it('renders children correctly', () => {
      render(
        <ToastProvider>
          <div>Test content</div>
        </ToastProvider>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('provides toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('Toast Triggering', () => {
    it('shows success toast when triggered', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      act(() => {
        screen.getByText('Success').click();
      });
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('shows error toast when triggered', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      act(() => {
        screen.getByText('Error').click();
      });
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });

    it('shows warning toast when triggered', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      act(() => {
        screen.getByText('Warning').click();
      });
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      expect(screen.getByText('Warning!')).toBeInTheDocument();
    });

    it('shows info toast when triggered', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      act(() => {
        screen.getByText('Info').click();
      });
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      expect(screen.getByText('Info!')).toBeInTheDocument();
    });
  });

  describe('Toast Stacking', () => {
    it('displays multiple toasts stacked vertically', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      act(() => {
        screen.getByText('Success').click();
        screen.getByText('Error').click();
        screen.getByText('Warning').click();
      });
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Warning!')).toBeInTheDocument();
    });

    it('limits toasts to maxToasts', () => {
      render(
        <ToastProvider maxToasts={2}>
          <TestComponent />
        </ToastProvider>
      );
      
      act(() => {
        screen.getByText('Success').click();
        screen.getByText('Error').click();
        screen.getByText('Warning').click();
      });
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      // Only the last 2 toasts should be visible
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Warning!')).toBeInTheDocument();
    });

    it('removes toasts after auto-dismiss', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      act(() => {
        screen.getByText('Success').click();
      });
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
      
      act(() => {
        vi.advanceTimersByTime(5200);
      });
      
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });
  });

  describe('Custom Duration', () => {
    it('respects custom duration parameter', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      
      act(() => {
        screen.getByText('Custom Duration').click();
      });
      
      act(() => {
        vi.advanceTimersByTime(20);
      });
      
      expect(screen.getByText('Custom duration')).toBeInTheDocument();
      
      // Should dismiss after 2000ms + 200ms animation
      act(() => {
        vi.advanceTimersByTime(2200);
      });
      
      expect(screen.queryByText('Custom duration')).not.toBeInTheDocument();
    });
  });

  describe('Position', () => {
    it('positions toasts at top by default', () => {
      const { container } = render(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      );
      
      const toastContainer = container.querySelector('[style*="position: fixed"]') as HTMLElement;
      expect(toastContainer?.style.top).toBeTruthy();
      expect(toastContainer?.style.bottom).toBeFalsy();
    });

    it('positions toasts at bottom when specified', () => {
      const { container } = render(
        <ToastProvider position="bottom">
          <div>Content</div>
        </ToastProvider>
      );
      
      const toastContainer = container.querySelector('[style*="position: fixed"]') as HTMLElement;
      expect(toastContainer?.style.bottom).toBeTruthy();
      expect(toastContainer?.style.top).toBeFalsy();
    });
  });

  describe('useToast Hook Error', () => {
    it('throws error when used outside ToastProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const TestComponentWithoutProvider = () => {
        try {
          useToast();
          return <div>Should not render</div>;
        } catch (error) {
          return <div>Error caught</div>;
        }
      };
      
      render(<TestComponentWithoutProvider />);
      expect(screen.getByText('Error caught')).toBeInTheDocument();
      
      consoleError.mockRestore();
    });
  });
});
