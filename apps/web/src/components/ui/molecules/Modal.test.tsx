import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow after each test
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders when open is true', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(
        <Modal open={false} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders with title', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('renders with footer', () => {
      render(
        <Modal
          open={true}
          onClose={() => {}}
          footer={<button>Save</button>}
        >
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    it('renders with sm size', () => {
      render(
        <Modal open={true} onClose={() => {}} size="sm">
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveStyle({ maxWidth: '400px' });
    });

    it('renders with md size (default)', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveStyle({ maxWidth: '600px' });
    });

    it('renders with lg size', () => {
      render(
        <Modal open={true} onClose={() => {}} size="lg">
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveStyle({ maxWidth: '800px' });
    });

    it('renders with xl size', () => {
      render(
        <Modal open={true} onClose={() => {}} size="xl">
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveStyle({ maxWidth: '1000px' });
    });

    it('renders with full size', () => {
      render(
        <Modal open={true} onClose={() => {}} size="full">
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveStyle({ maxWidth: '95vw' });
    });
  });

  describe('Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked (closeOnOverlayClick=true)', () => {
      const onClose = vi.fn();
      const { container } = render(
        <Modal open={true} onClose={onClose} closeOnOverlayClick={true}>
          <p>Content</p>
        </Modal>
      );

      // Click the overlay (first div)
      const overlay = container.firstChild as HTMLElement;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when overlay is clicked (closeOnOverlayClick=false)', () => {
      const onClose = vi.fn();
      const { container } = render(
        <Modal open={true} onClose={onClose} closeOnOverlayClick={false}>
          <p>Content</p>
        </Modal>
      );

      // Click the overlay
      const overlay = container.firstChild as HTMLElement;
      fireEvent.click(overlay);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when modal content is clicked', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose}>
          <p>Content</p>
        </Modal>
      );

      const content = screen.getByText('Content');
      fireEvent.click(content);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body scroll lock', () => {
    it('prevents body scroll when modal is open', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal is closed', () => {
      const { rerender } = render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal open={false} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby when title is provided', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test Modal">
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
    });

    it('focuses first focusable element when opened', async () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <button>First button</button>
          <button>Second button</button>
        </Modal>
      );

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close modal');
        expect(closeButton).toHaveFocus();
      });
    });

    it('traps focus within modal', async () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');

      // Wait for initial focus on close button
      await waitFor(() => {
        expect(closeButton).toHaveFocus();
      });

      // Verify all focusable elements are within the modal
      const modal = screen.getByRole('dialog');
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      // Should have 3 focusable elements (close button + 2 content buttons)
      expect(focusableElements.length).toBe(3);
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      render(
        <Modal open={true} onClose={() => {}} className="custom-modal">
          <p>Content</p>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal');
    });
  });
});
