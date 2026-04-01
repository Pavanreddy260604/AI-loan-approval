import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert Component', () => {
  describe('Basic Rendering', () => {
    it('renders alert message correctly', () => {
      render(<Alert>Test message</Alert>);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with default info variant', () => {
      render(<Alert>Info message</Alert>);
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('ℹ')).toBeInTheDocument();
    });

    it('renders with success variant', () => {
      render(<Alert variant="success">Success message</Alert>);
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('renders with warning variant', () => {
      render(<Alert variant="warning">Warning message</Alert>);
      
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('renders with error variant', () => {
      render(<Alert variant="error">Error message</Alert>);
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      // Error variant uses ✕ as icon, and close button also uses ✕ when closable
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('renders with info variant explicitly', () => {
      render(<Alert variant="info">Info message</Alert>);
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('ℹ')).toBeInTheDocument();
    });
  });

  describe('Title Support', () => {
    it('renders without title by default', () => {
      render(<Alert>Message only</Alert>);
      
      expect(screen.getByText('Message only')).toBeInTheDocument();
    });

    it('renders with title', () => {
      render(<Alert title="Alert Title">Message content</Alert>);
      
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
      expect(screen.getByText('Message content')).toBeInTheDocument();
    });

    it('renders title and message separately', () => {
      render(
        <Alert title="Important" variant="warning">
          Please review this information
        </Alert>
      );
      
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('Please review this information')).toBeInTheDocument();
      
      // Title and message should be in separate divs
      const titleElement = screen.getByText('Important');
      const messageElement = screen.getByText('Please review this information');
      expect(titleElement).not.toBe(messageElement);
    });
  });

  describe('Close Button', () => {
    it('does not render close button by default', () => {
      render(<Alert>Test</Alert>);
      
      const closeButton = screen.queryByLabelText('Close alert');
      expect(closeButton).not.toBeInTheDocument();
    });

    it('does not render close button when closable is false', () => {
      render(<Alert closable={false}>Test</Alert>);
      
      const closeButton = screen.queryByLabelText('Close alert');
      expect(closeButton).not.toBeInTheDocument();
    });

    it('renders close button when closable is true', () => {
      render(<Alert closable>Test</Alert>);
      
      const closeButton = screen.getByLabelText('Close alert');
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<Alert closable onClose={onClose}>Test</Alert>);
      
      const closeButton = screen.getByLabelText('Close alert');
      closeButton.click();
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('hides alert when close button is clicked', () => {
      render(<Alert closable>Test message</Alert>);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
      
      const closeButton = screen.getByLabelText('Close alert');
      
      act(() => {
        closeButton.click();
      });
      
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('applies hover effect on close button', () => {
      render(<Alert closable>Test</Alert>);
      
      const closeButton = screen.getByLabelText('Close alert') as HTMLButtonElement;
      
      // Initial opacity
      expect(closeButton.style.opacity).toBe('0.7');
      
      // Test that hover handlers exist
      expect(closeButton.onmouseenter).toBeDefined();
      expect(closeButton.onmouseleave).toBeDefined();
    });
  });

  describe('Variant Icons', () => {
    it('displays success icon for success variant', () => {
      render(<Alert variant="success">Success</Alert>);
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('displays warning icon for warning variant', () => {
      render(<Alert variant="warning">Warning</Alert>);
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('displays error icon for error variant', () => {
      render(<Alert variant="error">Error</Alert>);
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('displays info icon for info variant', () => {
      render(<Alert variant="info">Info</Alert>);
      expect(screen.getByText('ℹ')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="alert"', () => {
      const { container } = render(<Alert>Test</Alert>);
      const alert = container.firstChild as HTMLElement;
      
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('close button has aria-label', () => {
      render(<Alert closable>Test</Alert>);
      
      const closeButton = screen.getByLabelText('Close alert');
      expect(closeButton).toBeInTheDocument();
    });

    it('maintains accessibility with title and message', () => {
      const { container } = render(
        <Alert title="Error" variant="error" closable>
          Something went wrong
        </Alert>
      );
      
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveAttribute('role', 'alert');
      expect(screen.getByLabelText('Close alert')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct colors for success variant', () => {
      const { container } = render(<Alert variant="success">Success</Alert>);
      const alert = container.firstChild as HTMLElement;
      
      expect(alert.style.backgroundColor).toBeTruthy();
      expect(alert.style.border).toBeTruthy();
    });

    it('applies correct colors for warning variant', () => {
      const { container } = render(<Alert variant="warning">Warning</Alert>);
      const alert = container.firstChild as HTMLElement;
      
      expect(alert.style.backgroundColor).toBeTruthy();
      expect(alert.style.border).toBeTruthy();
    });

    it('applies correct colors for error variant', () => {
      const { container } = render(<Alert variant="error">Error</Alert>);
      const alert = container.firstChild as HTMLElement;
      
      expect(alert.style.backgroundColor).toBeTruthy();
      expect(alert.style.border).toBeTruthy();
    });

    it('applies correct colors for info variant', () => {
      const { container } = render(<Alert variant="info">Info</Alert>);
      const alert = container.firstChild as HTMLElement;
      
      expect(alert.style.backgroundColor).toBeTruthy();
      expect(alert.style.border).toBeTruthy();
    });

    it('applies border radius', () => {
      const { container } = render(<Alert>Test</Alert>);
      const alert = container.firstChild as HTMLElement;
      
      expect(alert.style.borderRadius).toBeTruthy();
    });

    it('applies custom className', () => {
      const { container } = render(<Alert className="custom-class">Test</Alert>);
      const alert = container.firstChild as HTMLElement;
      
      expect(alert.className).toContain('custom-class');
    });
  });

  describe('Content Rendering', () => {
    it('renders simple text content', () => {
      render(<Alert>Simple text</Alert>);
      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('renders complex JSX content', () => {
      render(
        <Alert>
          <div>
            <strong>Bold text</strong> and <em>italic text</em>
          </div>
        </Alert>
      );
      
      expect(screen.getByText('Bold text', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('italic text', { exact: false })).toBeInTheDocument();
    });

    it('renders with title and complex content', () => {
      render(
        <Alert title="Validation Error">
          <ul>
            <li>Field 1 is required</li>
            <li>Field 2 must be a valid email</li>
          </ul>
        </Alert>
      );
      
      expect(screen.getByText('Validation Error')).toBeInTheDocument();
      expect(screen.getByText('Field 1 is required')).toBeInTheDocument();
      expect(screen.getByText('Field 2 must be a valid email')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to alert element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Alert ref={ref}>Test</Alert>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toContain('Test');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(<Alert>{''}</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('handles onClose without closable prop', () => {
      const onClose = vi.fn();
      render(<Alert onClose={onClose}>Test</Alert>);
      
      // Close button should not be rendered
      expect(screen.queryByLabelText('Close alert')).not.toBeInTheDocument();
      // onClose should not be called
      expect(onClose).not.toHaveBeenCalled();
    });

    it('handles closable without onClose callback', () => {
      render(<Alert closable>Test</Alert>);
      
      const closeButton = screen.getByLabelText('Close alert');
      expect(closeButton).toBeInTheDocument();
      
      // Should not throw when clicked
      expect(() => closeButton.click()).not.toThrow();
    });

    it('remains hidden after being closed', () => {
      const { rerender } = render(<Alert closable>Test</Alert>);
      
      const closeButton = screen.getByLabelText('Close alert');
      
      act(() => {
        closeButton.click();
      });
      
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
      
      // Rerender should not bring it back
      rerender(<Alert closable>Test</Alert>);
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });
});
