import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from './Drawer';

describe('Drawer Component', () => {
  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow after each test
    document.body.style.overflow = '';
  });

  describe('Basic Rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = render(
        <Drawer open={false} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('renders drawer when open', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Drawer content
        </Drawer>
      );
      
      expect(screen.getByText('Drawer content')).toBeInTheDocument();
    });

    it('renders with title', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Settings">
          Content
        </Drawer>
      );
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders without title', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      expect(screen.getByLabelText('Close drawer')).toBeInTheDocument();
    });

    it('renders overlay', () => {
      const { container } = render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      // Overlay is the first div
      const overlay = container.querySelector('div[aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Direction Prop', () => {
    it('defaults to right direction', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.right).toBe('0px');
    });

    it('renders from left', () => {
      render(
        <Drawer open={true} onClose={() => {}} direction="left">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.left).toBe('0px');
    });

    it('renders from top', () => {
      render(
        <Drawer open={true} onClose={() => {}} direction="top">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.top).toBe('0px');
    });

    it('renders from bottom', () => {
      render(
        <Drawer open={true} onClose={() => {}} direction="bottom">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.bottom).toBe('0px');
    });
  });

  describe('Size Prop', () => {
    it('defaults to md size', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.width).toBe('480px');
    });

    it('renders sm size', () => {
      render(
        <Drawer open={true} onClose={() => {}} size="sm">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.width).toBe('320px');
    });

    it('renders lg size', () => {
      render(
        <Drawer open={true} onClose={() => {}} size="lg">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.width).toBe('640px');
    });

    it('renders full size', () => {
      render(
        <Drawer open={true} onClose={() => {}} size="full">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.width).toBe('100%');
    });

    it('applies height for vertical drawers', () => {
      render(
        <Drawer open={true} onClose={() => {}} direction="top" size="md">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.height).toBe('60%');
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(
        <Drawer open={true} onClose={onClose}>
          Content
        </Drawer>
      );
      
      const closeButton = screen.getByLabelText('Close drawer');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(
        <Drawer open={true} onClose={onClose}>
          Content
        </Drawer>
      );
      
      await user.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked by default', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      const { container } = render(
        <Drawer open={true} onClose={onClose}>
          Content
        </Drawer>
      );
      
      const overlay = container.querySelector('div[aria-hidden="true"]') as HTMLElement;
      await user.click(overlay);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when overlay is clicked if closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      const { container } = render(
        <Drawer open={true} onClose={onClose} closeOnOverlayClick={false}>
          Content
        </Drawer>
      );
      
      const overlay = container.querySelector('div[aria-hidden="true"]') as HTMLElement;
      await user.click(overlay);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when clicking inside drawer', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(
        <Drawer open={true} onClose={onClose}>
          <button>Inside button</button>
        </Drawer>
      );
      
      const insideButton = screen.getByText('Inside button');
      await user.click(insideButton);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('prevents body scroll when open', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(
        <Drawer open={false} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', () => {
      const { unmount } = render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      unmount();
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has role dialog', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label with title', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Settings">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveAttribute('aria-label', 'Settings');
    });

    it('has default aria-label without title', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveAttribute('aria-label', 'Drawer');
    });

    it('close button has aria-label', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const closeButton = screen.getByLabelText('Close drawer');
      expect(closeButton).toBeInTheDocument();
    });

    it('overlay has aria-hidden', () => {
      const { container } = render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const overlay = container.querySelector('div[aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('focuses first focusable element when opened', async () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          <button>First button</button>
          <button>Second button</button>
        </Drawer>
      );
      
      await waitFor(() => {
        // Close button is the first focusable element
        expect(document.activeElement).toBe(screen.getByLabelText('Close drawer'));
      });
    });

    it('returns focus to trigger element when closed', async () => {
      const TriggerComponent = () => {
        const [open, setOpen] = React.useState(false);
        
        return (
          <>
            <button onClick={() => setOpen(true)}>Open Drawer</button>
            <Drawer open={open} onClose={() => setOpen(false)}>
              Content
            </Drawer>
          </>
        );
      };
      
      const user = userEvent.setup();
      render(<TriggerComponent />);
      
      const trigger = screen.getByText('Open Drawer');
      await user.click(trigger);
      
      // Drawer should be open
      expect(screen.getByText('Content')).toBeInTheDocument();
      
      // Close drawer
      const closeButton = screen.getByLabelText('Close drawer');
      await user.click(closeButton);
      
      // Focus should return to trigger
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });

    it('traps Tab key within drawer', async () => {
      const user = userEvent.setup();
      
      render(
        <Drawer open={true} onClose={() => {}}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Drawer>
      );
      
      const closeButton = screen.getByLabelText('Close drawer');
      const button1 = screen.getByText('Button 1');
      const button2 = screen.getByText('Button 2');
      
      // Focus should start at close button
      await waitFor(() => {
        expect(document.activeElement).toBe(closeButton);
      });
      
      // Tab to next element
      await user.tab();
      expect(document.activeElement).toBe(button1);
      
      // Tab to next element
      await user.tab();
      expect(document.activeElement).toBe(button2);
      
      // Tab should wrap to first element
      await user.tab();
      expect(document.activeElement).toBe(closeButton);
    });

    it('traps Shift+Tab key within drawer', async () => {
      const user = userEvent.setup();
      
      render(
        <Drawer open={true} onClose={() => {}}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Drawer>
      );
      
      const closeButton = screen.getByLabelText('Close drawer');
      const button2 = screen.getByText('Button 2');
      
      // Focus should start at close button
      await waitFor(() => {
        expect(document.activeElement).toBe(closeButton);
      });
      
      // Shift+Tab should wrap to last element
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(button2);
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className', () => {
      render(
        <Drawer open={true} onClose={() => {}} className="custom-drawer">
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveClass('custom-drawer');
    });

    it('applies flex column layout', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveStyle({ 
        display: 'flex',
        flexDirection: 'column'
      });
    });

    it('applies fixed positioning', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveStyle({ position: 'fixed' });
    });

    it('applies background color', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.backgroundColor).toBeTruthy();
    });

    it('applies box shadow', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          Content
        </Drawer>
      );
      
      const drawer = screen.getByRole('dialog');
      expect(drawer.style.boxShadow).toBeTruthy();
    });
  });

  describe('Complex Content', () => {
    it('renders complex content with multiple elements', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Settings">
          <h3>Section 1</h3>
          <p>Paragraph 1</p>
          <button>Action 1</button>
          <h3>Section 2</h3>
          <p>Paragraph 2</p>
          <button>Action 2</button>
        </Drawer>
      );
      
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });

    it('renders form elements', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Form">
          <form>
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <button type="submit">Submit</button>
          </form>
        </Drawer>
      );
      
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to drawer element', () => {
      const ref = vi.fn();
      render(
        <Drawer open={true} onClose={() => {}} ref={ref}>
          Content
        </Drawer>
      );
      
      expect(ref).toHaveBeenCalled();
    });

    it('allows ref access to drawer element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Drawer open={true} onClose={() => {}} ref={ref}>
          Content
        </Drawer>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toContain('Content');
    });
  });
});
