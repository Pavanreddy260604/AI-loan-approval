import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tooltip, TooltipPlacement } from './Tooltip';

// Helper to wait for a specific time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Tooltip Component', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );
      
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('does not show tooltip initially', () => {
      render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );
      
      expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
    });

    it('renders tooltip content as string', async () => {
      render(
        <Tooltip content="Helpful tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByText('Helpful tooltip')).toBeInTheDocument();
      });
    });

    it('renders tooltip content as React element', async () => {
      render(
        <Tooltip content={<span>Complex <strong>content</strong></span>} delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByText(/Complex/)).toBeInTheDocument();
        expect(screen.getByText('content')).toBeInTheDocument();
      });
    });
  });

  describe('Hover Trigger', () => {
    it('shows tooltip on mouse enter after delay', async () => {
      render(
        <Tooltip content="Tooltip text" delay={100}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      // Should not show immediately
      expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      
      // Wait for delay
      await wait(150);
      
      await waitFor(() => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      
      // Show tooltip
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
      
      // Hide tooltip
      fireEvent.mouseLeave(button);
      await wait(250); // Wait for fade-out
      
      await waitFor(() => {
        expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      });
    });

    it('cancels tooltip show if mouse leaves before delay', async () => {
      render(
        <Tooltip content="Tooltip text" delay={200}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      
      // Hover and quickly unhover
      fireEvent.mouseEnter(button);
      await wait(50); // Only 50ms of 200ms delay
      fireEvent.mouseLeave(button);
      
      // Wait remaining time
      await wait(200);
      
      // Tooltip should not appear
      expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
    });
  });

  describe('Delay Configuration', () => {
    it('uses default delay of 300ms', async () => {
      render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      // Should not show before 300ms
      await wait(250);
      expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      
      // Should show after 300ms
      await wait(100);
      await waitFor(() => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
    });

    it('respects custom delay', async () => {
      render(
        <Tooltip content="Tooltip text" delay={150}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      // Should not show before 150ms
      await wait(100);
      expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
      
      // Should show after 150ms
      await wait(100);
      await waitFor(() => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
    });

    it('shows immediately with 0ms delay', async () => {
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
    });
  });

  describe('Placement Options', () => {
    const placements: TooltipPlacement[] = [
      'top',
      'bottom',
      'left',
      'right',
      'top-start',
      'top-end',
      'bottom-start',
      'bottom-end',
      'left-start',
      'left-end',
      'right-start',
      'right-end',
    ];

    placements.forEach((placement) => {
      it(`renders with ${placement} placement`, async () => {
        render(
          <Tooltip content="Tooltip text" placement={placement} delay={0}>
            <button>Hover me</button>
          </Tooltip>
        );
        
        const button = screen.getByText('Hover me');
        fireEvent.mouseEnter(button);
        
        await waitFor(() => {
          const tooltip = screen.getByText('Tooltip text');
          expect(tooltip).toBeInTheDocument();
          expect(tooltip).toHaveAttribute('role', 'tooltip');
        });
      });
    });

    it('uses top placement by default', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip).toBeInTheDocument();
        expect(tooltip.style.bottom).toBe('100%');
      });
    });
  });

  describe('Styling', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <Tooltip content="Tooltip text" className="custom-tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const tooltipContainer = container.firstChild as HTMLElement;
      expect(tooltipContainer).toHaveClass('custom-tooltip');
    });

    it('applies position relative to container', () => {
      const { container } = render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const tooltipContainer = container.firstChild as HTMLElement;
      expect(tooltipContainer).toHaveStyle({ position: 'relative' });
    });

    it('applies inline-block display to container', () => {
      const { container } = render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const tooltipContainer = container.firstChild as HTMLElement;
      expect(tooltipContainer).toHaveStyle({ display: 'inline-block' });
    });

    it('applies absolute positioning to tooltip', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip).toHaveStyle({ position: 'absolute' });
      });
    });

    it('applies high z-index to tooltip', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip.style.zIndex).toBe('1000');
      });
    });

    it('applies pointer-events none to tooltip', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip).toHaveStyle({ pointerEvents: 'none' });
      });
    });

    it('applies background color from design tokens', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip.style.backgroundColor).toBeTruthy();
      });
    });

    it('applies border radius from design tokens', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip.style.borderRadius).toBeTruthy();
      });
    });

    it('applies box shadow from design tokens', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip.style.boxShadow).toBeTruthy();
      });
    });
  });

  describe('Animation', () => {
    it('applies fade-in transition', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip.style.transition).toContain('opacity');
      });
    });

    it('starts with opacity 0 and transitions to 1', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(tooltip.style.opacity).toBe('1');
      });
    });
  });

  describe('Accessibility', () => {
    it('applies role="tooltip" to tooltip element', async () => {
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to container element', () => {
      const ref = vi.fn();
      render(
        <Tooltip content="Tooltip text" ref={ref}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });

    it('allows ref access to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Tooltip content="Tooltip text" ref={ref}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe('Hover me');
    });
  });

  describe('Multiple Tooltips', () => {
    it('handles multiple tooltips independently', async () => {
      render(
        <div>
          <Tooltip content="Tooltip 1" delay={0}>
            <button>Button 1</button>
          </Tooltip>
          <Tooltip content="Tooltip 2" delay={0}>
            <button>Button 2</button>
          </Tooltip>
        </div>
      );
      
      // Hover first button
      const button1 = screen.getByText('Button 1');
      fireEvent.mouseEnter(button1);
      
      await waitFor(() => {
        expect(screen.getByText('Tooltip 1')).toBeInTheDocument();
        expect(screen.queryByText('Tooltip 2')).not.toBeInTheDocument();
      });
      
      // Unhover first, hover second
      fireEvent.mouseLeave(button1);
      await wait(250);
      
      const button2 = screen.getByText('Button 2');
      fireEvent.mouseEnter(button2);
      
      await waitFor(() => {
        expect(screen.queryByText('Tooltip 1')).not.toBeInTheDocument();
        expect(screen.getByText('Tooltip 2')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content gracefully', async () => {
      render(
        <Tooltip content="" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip.textContent).toBe('');
      });
    });

    it('handles rapid hover/unhover cycles', async () => {
      render(
        <Tooltip content="Tooltip text" delay={50}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      const button = screen.getByText('Hover me');
      
      // Rapid hover/unhover - the last hover should trigger the tooltip
      fireEvent.mouseEnter(button);
      await wait(20);
      fireEvent.mouseLeave(button);
      fireEvent.mouseEnter(button);
      await wait(20);
      fireEvent.mouseLeave(button);
      fireEvent.mouseEnter(button);
      await wait(100); // Wait longer than delay
      
      // Should show tooltip after final hover
      await waitFor(() => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
    });

    it('cleans up timeout on unmount', () => {
      const { unmount } = render(
        <Tooltip content="Tooltip text" delay={300}>
          <button>Hover me</button>
        </Tooltip>
      );
      
      // Should not throw error
      expect(() => unmount()).not.toThrow();
    });
  });
});
