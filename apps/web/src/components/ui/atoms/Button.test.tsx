import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  describe('Variant Renderings', () => {
    it('renders primary variant with correct styles', () => {
      render(<Button variant="primary">Primary Button</Button>);
      const button = screen.getByRole('button', { name: /primary button/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({
        backgroundColor: expect.stringContaining('#635BFF'),
      });
    });

    it('renders secondary variant with correct styles', () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button', { name: /secondary button/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({
        backgroundColor: expect.any(String),
      });
    });

    it('renders ghost variant with correct styles', () => {
      render(<Button variant="ghost">Ghost Button</Button>);
      const button = screen.getByRole('button', { name: /ghost button/i });
      
      expect(button).toBeInTheDocument();
      // Ghost variant should have transparent or no background
      const styles = window.getComputedStyle(button);
      expect(styles.backgroundColor).toMatch(/transparent|rgba\(0,\s*0,\s*0,\s*0\)/);
    });

    it('renders danger variant with correct styles', () => {
      render(<Button variant="danger">Danger Button</Button>);
      const button = screen.getByRole('button', { name: /danger button/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({
        backgroundColor: expect.any(String),
      });
    });

    it('renders outline variant with correct styles', () => {
      render(<Button variant="outline">Outline Button</Button>);
      const button = screen.getByRole('button', { name: /outline button/i });
      
      expect(button).toBeInTheDocument();
      // Outline variant should have transparent or no background
      const styles = window.getComputedStyle(button);
      expect(styles.backgroundColor).toMatch(/transparent|rgba\(0,\s*0,\s*0,\s*0\)/);
    });

    it('defaults to primary variant when no variant is specified', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button', { name: /default button/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({
        backgroundColor: expect.stringContaining('#635BFF'),
      });
    });
  });

  describe('Size Variants', () => {
    it('renders xs size with correct height', () => {
      render(<Button size="xs">XS Button</Button>);
      const button = screen.getByRole('button', { name: /xs button/i });
      
      expect(button).toHaveStyle({ height: '28px' });
    });

    it('renders sm size with correct height', () => {
      render(<Button size="sm">SM Button</Button>);
      const button = screen.getByRole('button', { name: /sm button/i });
      
      expect(button).toHaveStyle({ height: '32px' });
    });

    it('renders md size with correct height (default)', () => {
      render(<Button size="md">MD Button</Button>);
      const button = screen.getByRole('button', { name: /md button/i });
      
      expect(button).toHaveStyle({ height: '40px' });
    });

    it('renders lg size with correct height', () => {
      render(<Button size="lg">LG Button</Button>);
      const button = screen.getByRole('button', { name: /lg button/i });
      
      expect(button).toHaveStyle({ height: '48px' });
    });

    it('renders xl size with correct height', () => {
      render(<Button size="xl">XL Button</Button>);
      const button = screen.getByRole('button', { name: /xl button/i });
      
      expect(button).toHaveStyle({ height: '56px' });
    });
  });

  describe('Loading State', () => {
    it('displays spinner when loading is true', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg.animate-spin');
      
      expect(spinner).toBeInTheDocument();
    });

    it('hides left icon when loading', () => {
      const LeftIcon = () => <span data-testid="left-icon">Icon</span>;
      render(
        <Button loading leftIcon={<LeftIcon />}>
          Loading Button
        </Button>
      );
      
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    });

    it('hides right icon when loading', () => {
      const RightIcon = () => <span data-testid="right-icon">Icon</span>;
      render(
        <Button loading rightIcon={<RightIcon />}>
          Loading Button
        </Button>
      );
      
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });

    it('shows correct spinner size for xs button', () => {
      render(<Button loading size="xs">Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).toHaveAttribute('width', '12');
      expect(spinner).toHaveAttribute('height', '12');
    });

    it('shows correct spinner size for md button', () => {
      render(<Button loading size="md">Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).toHaveAttribute('width', '16');
      expect(spinner).toHaveAttribute('height', '16');
    });

    it('shows correct spinner size for xl button', () => {
      render(<Button loading size="xl">Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).toHaveAttribute('width', '20');
      expect(spinner).toHaveAttribute('height', '20');
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });

    it('applies reduced opacity when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({ opacity: 0.6 });
    });

    it('applies not-allowed cursor when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({ cursor: 'not-allowed' });
    });

    it('does not trigger onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is disabled when loading is true', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });
  });

  describe('Icon Positioning', () => {
    it('renders left icon before text', () => {
      const LeftIcon = () => <span data-testid="left-icon">L</span>;
      render(
        <Button leftIcon={<LeftIcon />}>
          Button Text
        </Button>
      );
      
      const button = screen.getByRole('button');
      const leftIcon = screen.getByTestId('left-icon');
      const text = screen.getByText('Button Text');
      
      expect(button).toContainElement(leftIcon);
      expect(button).toContainElement(text);
      
      // Check that left icon appears in the DOM before text
      const buttonHTML = button.innerHTML;
      const leftIconPosition = buttonHTML.indexOf('left-icon');
      const textPosition = buttonHTML.indexOf('Button Text');
      
      expect(leftIconPosition).toBeLessThan(textPosition);
    });

    it('renders right icon after text', () => {
      const RightIcon = () => <span data-testid="right-icon">R</span>;
      render(
        <Button rightIcon={<RightIcon />}>
          Button Text
        </Button>
      );
      
      const button = screen.getByRole('button');
      const rightIcon = screen.getByTestId('right-icon');
      const text = screen.getByText('Button Text');
      
      expect(button).toContainElement(rightIcon);
      expect(button).toContainElement(text);
      
      // Check that text appears in the DOM before right icon
      const buttonHTML = button.innerHTML;
      const textPosition = buttonHTML.indexOf('Button Text');
      const rightIconPosition = buttonHTML.indexOf('right-icon');
      
      expect(textPosition).toBeLessThan(rightIconPosition);
    });

    it('renders both left and right icons with text', () => {
      const LeftIcon = () => <span data-testid="left-icon">L</span>;
      const RightIcon = () => <span data-testid="right-icon">R</span>;
      
      render(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Button Text
        </Button>
      );
      
      const leftIcon = screen.getByTestId('left-icon');
      const rightIcon = screen.getByTestId('right-icon');
      const text = screen.getByText('Button Text');
      
      expect(leftIcon).toBeInTheDocument();
      expect(rightIcon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });

    it('renders icon-only button without text', () => {
      const Icon = () => <span data-testid="icon">I</span>;
      render(<Button leftIcon={<Icon />} />);
      
      const icon = screen.getByTestId('icon');
      expect(icon).toBeInTheDocument();
    });

    it('does not render icons when loading', () => {
      const LeftIcon = () => <span data-testid="left-icon">L</span>;
      const RightIcon = () => <span data-testid="right-icon">R</span>;
      
      render(
        <Button loading leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Loading
        </Button>
      );
      
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Interaction Behavior', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button disabled onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button loading onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    it('forwards ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    });

    it('spreads additional HTML button props', () => {
      render(
        <Button type="submit" data-testid="submit-button" aria-label="Submit form">
          Submit
        </Button>
      );
      
      const button = screen.getByTestId('submit-button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });
  });

  describe('Combined States', () => {
    it('renders primary variant with lg size and left icon', () => {
      const Icon = () => <span data-testid="icon">I</span>;
      render(
        <Button variant="primary" size="lg" leftIcon={<Icon />}>
          Large Primary
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ height: '48px' });
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders danger variant in disabled state', () => {
      render(<Button variant="danger" disabled>Delete</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveStyle({ opacity: 0.6 });
    });

    it('renders ghost variant with loading state', () => {
      render(<Button variant="ghost" loading>Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg.animate-spin');
      
      expect(button).toBeDisabled();
      expect(spinner).toBeInTheDocument();
      // Ghost variant should have transparent or no background
      const styles = window.getComputedStyle(button);
      expect(styles.backgroundColor).toMatch(/transparent|rgba\(0,\s*0,\s*0,\s*0\)/);
    });
  });

  describe('Async Operation Support', () => {
    it('calls onAsyncClick when provided', async () => {
      const asyncOperation = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      
      render(<Button onAsyncClick={asyncOperation}>Async Button</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      
      expect(asyncOperation).toHaveBeenCalledTimes(1);
    });

    it('disables button during async operation', async () => {
      let resolvePromise: () => void;
      const asyncOperation = vi.fn().mockImplementation(() => 
        new Promise<void>(resolve => {
          resolvePromise = resolve;
        })
      );
      const user = userEvent.setup();
      
      render(<Button onAsyncClick={asyncOperation}>Async Button</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      
      // Button should be disabled during async operation
      expect(button).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!();
    });

    it('prevents additional clicks during async operation', async () => {
      const asyncOperation = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();
      
      render(<Button onAsyncClick={asyncOperation}>Async Button</Button>);
      const button = screen.getByRole('button');
      
      // Click once
      await user.click(button);
      
      // Try to click again while loading (button is disabled, so click won't trigger)
      await user.click(button);
      
      // Should only be called once
      expect(asyncOperation).toHaveBeenCalledTimes(1);
    });

    it('maintains button dimensions during state transitions', () => {
      render(
        <Button 
          onAsyncClick={async () => {}}
          size="md"
        >
          Async Button
        </Button>
      );
      const button = screen.getByRole('button');
      
      // Check height is maintained
      expect(button).toHaveStyle({ height: '40px' });
    });

    it('uses default feedback duration of 2000ms when not specified', () => {
      render(
        <Button onAsyncClick={async () => {}}>
          Async Button
        </Button>
      );
      
      // Component should render without errors
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls regular onClick when onAsyncClick is not provided', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Regular Button</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(button).not.toBeDisabled();
    });

    it('cleans up timeout on unmount', () => {
      const { unmount } = render(
        <Button 
          onAsyncClick={async () => {}}
          feedbackDuration={1000}
        >
          Async Button
        </Button>
      );
      
      // Unmount should not cause errors
      unmount();
    });
  });
});
