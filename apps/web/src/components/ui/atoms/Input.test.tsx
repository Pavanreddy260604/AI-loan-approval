import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  describe('Variant Renderings', () => {
    it('renders default variant with correct styles', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      
      expect(input).toBeInTheDocument();
      expect(input).toHaveStyle({
        borderColor: expect.any(String),
      });
    });

    it('renders error variant with correct styles', () => {
      render(<Input variant="error" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('renders success variant with correct styles', () => {
      render(<Input variant="success" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      
      expect(input).toBeInTheDocument();
    });

    it('defaults to default variant when no variant is specified', () => {
      render(<Input placeholder="Default input" />);
      const input = screen.getByPlaceholderText('Default input');
      
      expect(input).toBeInTheDocument();
    });
  });

  describe('Label Support', () => {
    it('renders label when provided', () => {
      render(<Input label="Email Address" placeholder="Enter email" />);
      const label = screen.getByText('Email Address');
      
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('associates label with input using htmlFor', () => {
      render(<Input label="Username" placeholder="Enter username" />);
      const label = screen.getByText('Username');
      const input = screen.getByPlaceholderText('Enter username');
      
      expect(label).toHaveAttribute('for', input.id);
    });

    it('renders without label when not provided', () => {
      render(<Input placeholder="No label" />);
      const input = screen.getByPlaceholderText('No label');
      
      expect(input).toBeInTheDocument();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('Error Message Support', () => {
    it('renders error message when provided', () => {
      render(<Input error="This field is required" placeholder="Enter text" />);
      const errorMessage = screen.getByText('This field is required');
      
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    it('sets aria-invalid when error is present', () => {
      render(<Input error="Invalid input" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('associates error message with input using aria-describedby', () => {
      render(<Input error="Error message" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      const errorMessage = screen.getByText('Error message');
      
      expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
    });

    it('overrides variant to error when error message is provided', () => {
      render(<Input variant="success" error="Error occurred" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Hint Text Support', () => {
    it('renders hint text when provided', () => {
      render(<Input hint="Enter your email address" placeholder="Email" />);
      const hint = screen.getByText('Enter your email address');
      
      expect(hint).toBeInTheDocument();
    });

    it('associates hint text with input using aria-describedby', () => {
      render(<Input hint="Helper text" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      const hint = screen.getByText('Helper text');
      
      expect(input).toHaveAttribute('aria-describedby', hint.id);
    });

    it('does not render hint when error is present', () => {
      render(
        <Input 
          hint="This is a hint" 
          error="This is an error" 
          placeholder="Enter text" 
        />
      );
      
      expect(screen.getByText('This is an error')).toBeInTheDocument();
      expect(screen.queryByText('This is a hint')).not.toBeInTheDocument();
    });

    it('renders hint when no error is present', () => {
      render(<Input hint="Helpful hint" placeholder="Enter text" />);
      
      expect(screen.getByText('Helpful hint')).toBeInTheDocument();
    });
  });

  describe('Icon Positioning', () => {
    it('renders left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">L</span>;
      render(<Input leftIcon={<LeftIcon />} placeholder="Enter text" />);
      
      const leftIcon = screen.getByTestId('left-icon');
      expect(leftIcon).toBeInTheDocument();
    });

    it('renders right icon', () => {
      const RightIcon = () => <span data-testid="right-icon">R</span>;
      render(<Input rightIcon={<RightIcon />} placeholder="Enter text" />);
      
      const rightIcon = screen.getByTestId('right-icon');
      expect(rightIcon).toBeInTheDocument();
    });

    it('renders both left and right icons', () => {
      const LeftIcon = () => <span data-testid="left-icon">L</span>;
      const RightIcon = () => <span data-testid="right-icon">R</span>;
      
      render(
        <Input 
          leftIcon={<LeftIcon />} 
          rightIcon={<RightIcon />} 
          placeholder="Enter text" 
        />
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders without icons when not provided', () => {
      render(<Input placeholder="No icons" />);
      const input = screen.getByPlaceholderText('No icons');
      
      expect(input).toBeInTheDocument();
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<Input disabled placeholder="Disabled input" />);
      const input = screen.getByPlaceholderText('Disabled input');
      
      expect(input).toBeDisabled();
    });

    it('applies reduced opacity when disabled', () => {
      render(<Input disabled placeholder="Disabled input" />);
      const input = screen.getByPlaceholderText('Disabled input');
      
      expect(input).toHaveStyle({ opacity: 0.6 });
    });

    it('applies not-allowed cursor when disabled', () => {
      render(<Input disabled placeholder="Disabled input" />);
      const input = screen.getByPlaceholderText('Disabled input');
      
      expect(input).toHaveStyle({ cursor: 'not-allowed' });
    });

    it('does not trigger onChange when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input disabled onChange={handleChange} placeholder="Disabled input" />);
      const input = screen.getByPlaceholderText('Disabled input');
      
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Interaction Behavior', () => {
    it('calls onChange handler when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here');
      
      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('updates value when typing', async () => {
      const user = userEvent.setup();
      
      render(<Input placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
      
      await user.type(input, 'hello');
      expect(input.value).toBe('hello');
    });

    it('applies custom className', () => {
      render(<Input className="custom-class" placeholder="Custom input" />);
      const container = screen.getByPlaceholderText('Custom input').parentElement?.parentElement;
      
      expect(container).toHaveClass('custom-class');
    });

    it('forwards ref to input element', () => {
      const ref = vi.fn();
      render(<Input ref={ref} placeholder="Ref input" />);
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });

    it('spreads additional HTML input props', () => {
      render(
        <Input 
          type="email" 
          data-testid="email-input" 
          aria-label="Email address"
          placeholder="Email"
        />
      );
      
      const input = screen.getByTestId('email-input');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('aria-label', 'Email address');
    });
  });

  describe('Focus Ring Behavior', () => {
    it('applies focus styles when focused', async () => {
      const user = userEvent.setup();
      
      render(<Input placeholder="Focus me" />);
      const input = screen.getByPlaceholderText('Focus me');
      
      await user.click(input);
      expect(input).toHaveFocus();
    });

    it('removes focus styles when blurred', async () => {
      const user = userEvent.setup();
      
      render(
        <>
          <Input placeholder="Focus me" />
          <button>Other element</button>
        </>
      );
      const input = screen.getByPlaceholderText('Focus me');
      const button = screen.getByRole('button');
      
      await user.click(input);
      expect(input).toHaveFocus();
      
      await user.click(button);
      expect(input).not.toHaveFocus();
    });
  });

  describe('Combined States', () => {
    it('renders with label, error, and left icon', () => {
      const Icon = () => <span data-testid="icon">I</span>;
      render(
        <Input 
          label="Email" 
          error="Invalid email" 
          leftIcon={<Icon />}
          placeholder="Enter email"
        />
      );
      
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders with label, hint, and right icon', () => {
      const Icon = () => <span data-testid="icon">I</span>;
      render(
        <Input 
          label="Password" 
          hint="Must be 8+ characters" 
          rightIcon={<Icon />}
          placeholder="Enter password"
        />
      );
      
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders success variant with label and hint', () => {
      render(
        <Input 
          variant="success" 
          label="Username" 
          hint="Available" 
          placeholder="Enter username"
        />
      );
      
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
    });

    it('renders disabled input with label and hint', () => {
      render(
        <Input 
          disabled 
          label="Disabled Field" 
          hint="This field is disabled" 
          placeholder="Cannot type"
        />
      );
      
      const input = screen.getByPlaceholderText('Cannot type');
      expect(input).toBeDisabled();
      expect(screen.getByText('Disabled Field')).toBeInTheDocument();
      expect(screen.getByText('This field is disabled')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('generates unique IDs for multiple inputs', () => {
      render(
        <>
          <Input label="First" placeholder="First input" />
          <Input label="Second" placeholder="Second input" />
        </>
      );
      
      const firstInput = screen.getByPlaceholderText('First input');
      const secondInput = screen.getByPlaceholderText('Second input');
      
      expect(firstInput.id).not.toBe(secondInput.id);
    });

    it('uses provided ID when specified', () => {
      render(<Input id="custom-id" placeholder="Custom ID input" />);
      const input = screen.getByPlaceholderText('Custom ID input');
      
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('has proper ARIA attributes for error state', () => {
      render(<Input error="Error message" placeholder="Error input" />);
      const input = screen.getByPlaceholderText('Error input');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('has proper ARIA attributes for hint state', () => {
      render(<Input hint="Hint message" placeholder="Hint input" />);
      const input = screen.getByPlaceholderText('Hint input');
      
      expect(input).toHaveAttribute('aria-describedby');
    });
  });
});
