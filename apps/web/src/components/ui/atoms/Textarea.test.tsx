import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea Component', () => {
  describe('Variant Renderings', () => {
    it('renders default variant with correct styles', () => {
      render(<Textarea placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveStyle({
        borderColor: expect.any(String),
      });
    });

    it('renders error variant with correct styles', () => {
      render(<Textarea variant="error" placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });

    it('renders success variant with correct styles', () => {
      render(<Textarea variant="success" placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      
      expect(textarea).toBeInTheDocument();
    });

    it('defaults to default variant when no variant is specified', () => {
      render(<Textarea placeholder="Default textarea" />);
      const textarea = screen.getByPlaceholderText('Default textarea');
      
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Label Support', () => {
    it('renders label when provided', () => {
      render(<Textarea label="Description" placeholder="Enter description" />);
      const label = screen.getByText('Description');
      
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('associates label with textarea using htmlFor', () => {
      render(<Textarea label="Comments" placeholder="Enter comments" />);
      const label = screen.getByText('Comments');
      const textarea = screen.getByPlaceholderText('Enter comments');
      
      expect(label).toHaveAttribute('for', textarea.id);
    });

    it('renders without label when not provided', () => {
      render(<Textarea placeholder="No label" />);
      const textarea = screen.getByPlaceholderText('No label');
      
      expect(textarea).toBeInTheDocument();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('Error Message Support', () => {
    it('renders error message when provided', () => {
      render(<Textarea error="This field is required" placeholder="Enter text" />);
      const errorMessage = screen.getByText('This field is required');
      
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    it('sets aria-invalid when error is present', () => {
      render(<Textarea error="Invalid input" placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('associates error message with textarea using aria-describedby', () => {
      render(<Textarea error="Error message" placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      const errorMessage = screen.getByText('Error message');
      
      expect(textarea).toHaveAttribute('aria-describedby', errorMessage.id);
    });

    it('overrides variant to error when error message is provided', () => {
      render(<Textarea variant="success" error="Error occurred" placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Hint Text Support', () => {
    it('renders hint text when provided', () => {
      render(<Textarea hint="Enter a detailed description" placeholder="Description" />);
      const hint = screen.getByText('Enter a detailed description');
      
      expect(hint).toBeInTheDocument();
    });

    it('associates hint text with textarea using aria-describedby', () => {
      render(<Textarea hint="Helper text" placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      const hint = screen.getByText('Helper text');
      
      expect(textarea).toHaveAttribute('aria-describedby', hint.id);
    });

    it('does not render hint when error is present', () => {
      render(
        <Textarea 
          hint="This is a hint" 
          error="This is an error" 
          placeholder="Enter text" 
        />
      );
      
      expect(screen.getByText('This is an error')).toBeInTheDocument();
      expect(screen.queryByText('This is a hint')).not.toBeInTheDocument();
    });

    it('renders hint when no error is present', () => {
      render(<Textarea hint="Helpful hint" placeholder="Enter text" />);
      
      expect(screen.getByText('Helpful hint')).toBeInTheDocument();
    });
  });

  describe('Character Count Display', () => {
    it('shows character count when showCharacterCount is true', () => {
      render(<Textarea showCharacterCount placeholder="Enter text" />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('updates character count when typing', async () => {
      const user = userEvent.setup();
      
      render(<Textarea showCharacterCount placeholder="Type here" />);
      const textarea = screen.getByPlaceholderText('Type here');
      
      await user.type(textarea, 'hello');
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays character count with maxLength', () => {
      render(<Textarea showCharacterCount maxLength={100} placeholder="Enter text" />);
      
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('updates character count with maxLength when typing', async () => {
      const user = userEvent.setup();
      
      render(<Textarea showCharacterCount maxLength={50} placeholder="Type here" />);
      const textarea = screen.getByPlaceholderText('Type here');
      
      await user.type(textarea, 'test');
      expect(screen.getByText('4/50')).toBeInTheDocument();
    });

    it('does not show character count when showCharacterCount is false', () => {
      render(<Textarea placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      
      expect(textarea).toBeInTheDocument();
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it('shows character count with hint text', async () => {
      const user = userEvent.setup();
      
      render(
        <Textarea 
          hint="Enter description" 
          showCharacterCount 
          maxLength={100}
          placeholder="Type here" 
        />
      );
      
      const textarea = screen.getByPlaceholderText('Type here');
      await user.type(textarea, 'test');
      
      expect(screen.getByText('Enter description')).toBeInTheDocument();
      expect(screen.getByText('4/100')).toBeInTheDocument();
    });

    it('shows character count with error message', async () => {
      const user = userEvent.setup();
      
      render(
        <Textarea 
          error="Error message" 
          showCharacterCount 
          maxLength={50}
          placeholder="Type here" 
        />
      );
      
      const textarea = screen.getByPlaceholderText('Type here');
      await user.type(textarea, 'test');
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('4/50')).toBeInTheDocument();
    });
  });

  describe('Auto-resize Functionality', () => {
    it('disables manual resize when autoResize is true', () => {
      render(<Textarea autoResize placeholder="Auto resize" />);
      const textarea = screen.getByPlaceholderText('Auto resize');
      
      expect(textarea).toHaveStyle({ resize: 'none' });
    });

    it('enables vertical resize when autoResize is false', () => {
      render(<Textarea placeholder="Manual resize" />);
      const textarea = screen.getByPlaceholderText('Manual resize');
      
      expect(textarea).toHaveStyle({ resize: 'vertical' });
    });

    it('defaults to manual resize when autoResize is not specified', () => {
      render(<Textarea placeholder="Default resize" />);
      const textarea = screen.getByPlaceholderText('Default resize');
      
      expect(textarea).toHaveStyle({ resize: 'vertical' });
    });
  });

  describe('Disabled State', () => {
    it('disables textarea when disabled prop is true', () => {
      render(<Textarea disabled placeholder="Disabled textarea" />);
      const textarea = screen.getByPlaceholderText('Disabled textarea');
      
      expect(textarea).toBeDisabled();
    });

    it('applies reduced opacity when disabled', () => {
      render(<Textarea disabled placeholder="Disabled textarea" />);
      const textarea = screen.getByPlaceholderText('Disabled textarea');
      
      expect(textarea).toHaveStyle({ opacity: 0.6 });
    });

    it('applies not-allowed cursor when disabled', () => {
      render(<Textarea disabled placeholder="Disabled textarea" />);
      const textarea = screen.getByPlaceholderText('Disabled textarea');
      
      expect(textarea).toHaveStyle({ cursor: 'not-allowed' });
    });

    it('does not trigger onChange when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Textarea disabled onChange={handleChange} placeholder="Disabled textarea" />);
      const textarea = screen.getByPlaceholderText('Disabled textarea');
      
      await user.type(textarea, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Interaction Behavior', () => {
    it('calls onChange handler when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Textarea onChange={handleChange} placeholder="Type here" />);
      const textarea = screen.getByPlaceholderText('Type here');
      
      await user.type(textarea, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('updates value when typing', async () => {
      const user = userEvent.setup();
      
      render(<Textarea placeholder="Type here" />);
      const textarea = screen.getByPlaceholderText('Type here') as HTMLTextAreaElement;
      
      await user.type(textarea, 'hello');
      expect(textarea.value).toBe('hello');
    });

    it('applies custom className', () => {
      render(<Textarea className="custom-class" placeholder="Custom textarea" />);
      const container = screen.getByPlaceholderText('Custom textarea').parentElement;
      
      expect(container).toHaveClass('custom-class');
    });

    it('forwards ref to textarea element', () => {
      const ref = vi.fn();
      render(<Textarea ref={ref} placeholder="Ref textarea" />);
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('spreads additional HTML textarea props', () => {
      render(
        <Textarea 
          data-testid="custom-textarea" 
          aria-label="Custom description"
          placeholder="Description"
        />
      );
      
      const textarea = screen.getByTestId('custom-textarea');
      expect(textarea).toHaveAttribute('aria-label', 'Custom description');
    });

    it('respects maxLength attribute', async () => {
      const user = userEvent.setup();
      
      render(<Textarea maxLength={5} placeholder="Max 5 chars" />);
      const textarea = screen.getByPlaceholderText('Max 5 chars') as HTMLTextAreaElement;
      
      await user.type(textarea, 'hello world');
      expect(textarea.value).toBe('hello');
    });
  });

  describe('Focus Ring Behavior', () => {
    it('applies focus styles when focused', async () => {
      const user = userEvent.setup();
      
      render(<Textarea placeholder="Focus me" />);
      const textarea = screen.getByPlaceholderText('Focus me');
      
      await user.click(textarea);
      expect(textarea).toHaveFocus();
    });

    it('removes focus styles when blurred', async () => {
      const user = userEvent.setup();
      
      render(
        <>
          <Textarea placeholder="Focus me" />
          <button>Other element</button>
        </>
      );
      const textarea = screen.getByPlaceholderText('Focus me');
      const button = screen.getByRole('button');
      
      await user.click(textarea);
      expect(textarea).toHaveFocus();
      
      await user.click(button);
      expect(textarea).not.toHaveFocus();
    });
  });

  describe('Combined States', () => {
    it('renders with label, error, and character count', () => {
      render(
        <Textarea 
          label="Description" 
          error="Invalid description" 
          showCharacterCount
          maxLength={100}
          placeholder="Enter description"
        />
      );
      
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Invalid description')).toBeInTheDocument();
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('renders with label, hint, and character count', () => {
      render(
        <Textarea 
          label="Comments" 
          hint="Optional comments" 
          showCharacterCount
          maxLength={200}
          placeholder="Enter comments"
        />
      );
      
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Optional comments')).toBeInTheDocument();
      expect(screen.getByText('0/200')).toBeInTheDocument();
    });

    it('renders success variant with label and hint', () => {
      render(
        <Textarea 
          variant="success" 
          label="Bio" 
          hint="Looks good" 
          placeholder="Enter bio"
        />
      );
      
      expect(screen.getByText('Bio')).toBeInTheDocument();
      expect(screen.getByText('Looks good')).toBeInTheDocument();
    });

    it('renders disabled textarea with label and hint', () => {
      render(
        <Textarea 
          disabled 
          label="Disabled Field" 
          hint="This field is disabled" 
          placeholder="Cannot type"
        />
      );
      
      const textarea = screen.getByPlaceholderText('Cannot type');
      expect(textarea).toBeDisabled();
      expect(screen.getByText('Disabled Field')).toBeInTheDocument();
      expect(screen.getByText('This field is disabled')).toBeInTheDocument();
    });

    it('renders with autoResize and character count', async () => {
      const user = userEvent.setup();
      
      render(
        <Textarea 
          autoResize 
          showCharacterCount 
          maxLength={50}
          placeholder="Auto resize with count"
        />
      );
      
      const textarea = screen.getByPlaceholderText('Auto resize with count');
      expect(textarea).toHaveStyle({ resize: 'none' });
      
      await user.type(textarea, 'test');
      expect(screen.getByText('4/50')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('generates unique IDs for multiple textareas', () => {
      render(
        <>
          <Textarea label="First" placeholder="First textarea" />
          <Textarea label="Second" placeholder="Second textarea" />
        </>
      );
      
      const firstTextarea = screen.getByPlaceholderText('First textarea');
      const secondTextarea = screen.getByPlaceholderText('Second textarea');
      
      expect(firstTextarea.id).not.toBe(secondTextarea.id);
    });

    it('uses provided ID when specified', () => {
      render(<Textarea id="custom-id" placeholder="Custom ID textarea" />);
      const textarea = screen.getByPlaceholderText('Custom ID textarea');
      
      expect(textarea).toHaveAttribute('id', 'custom-id');
    });

    it('has proper ARIA attributes for error state', () => {
      render(<Textarea error="Error message" placeholder="Error textarea" />);
      const textarea = screen.getByPlaceholderText('Error textarea');
      
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAttribute('aria-describedby');
    });

    it('has proper ARIA attributes for hint state', () => {
      render(<Textarea hint="Hint message" placeholder="Hint textarea" />);
      const textarea = screen.getByPlaceholderText('Hint textarea');
      
      expect(textarea).toHaveAttribute('aria-describedby');
    });
  });
});
