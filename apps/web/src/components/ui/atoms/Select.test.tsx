import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, SelectOption } from './Select';

const mockOptions: SelectOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
];

describe('Select Component', () => {
  describe('Basic Rendering', () => {
    it('renders with label', () => {
      render(<Select label="Country" options={mockOptions} />);
      
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Select options={mockOptions} placeholder="Choose a country" />);
      
      expect(screen.getByText('Choose a country')).toBeInTheDocument();
    });

    it('renders with hint text', () => {
      render(<Select options={mockOptions} hint="Select your country" />);
      
      expect(screen.getByText('Select your country')).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(<Select options={mockOptions} error="Country is required" />);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Country is required');
    });

    it('does not show hint when error is present', () => {
      render(
        <Select
          options={mockOptions}
          hint="Select your country"
          error="Country is required"
        />
      );
      
      expect(screen.queryByText('Select your country')).not.toBeInTheDocument();
      expect(screen.getByText('Country is required')).toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('displays all options when opened', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        mockOptions.forEach(option => {
          expect(screen.getByText(option.label)).toBeInTheDocument();
        });
      });
    });

    it('closes dropdown when option is selected', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const option = await screen.findByText('Canada');
      await user.click(option);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('updates selected value when option is clicked', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const option = await screen.findByText('Canada');
      await user.click(option);
      
      expect(trigger).toHaveTextContent('Canada');
    });

    it('calls onChange handler with selected value', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Select options={mockOptions} onChange={handleChange} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const option = await screen.findByText('United Kingdom');
      await user.click(option);
      
      expect(handleChange).toHaveBeenCalledWith('uk');
    });
  });

  describe('Search Functionality', () => {
    it('renders search input when searchable is true', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} searchable />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });
    });

    it('filters options based on search query', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} searchable />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const searchInput = await screen.findByPlaceholderText('Search...');
      await user.type(searchInput, 'united');
      
      await waitFor(() => {
        expect(screen.getByText('United States')).toBeInTheDocument();
        expect(screen.getByText('United Kingdom')).toBeInTheDocument();
        expect(screen.queryByText('Canada')).not.toBeInTheDocument();
        expect(screen.queryByText('Australia')).not.toBeInTheDocument();
      });
    });

    it('shows "No options found" when search has no results', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} searchable />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const searchInput = await screen.findByPlaceholderText('Search...');
      await user.type(searchInput, 'xyz');
      
      await waitFor(() => {
        expect(screen.getByText('No options found')).toBeInTheDocument();
      });
    });

    it('search is case-insensitive', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} searchable />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const searchInput = await screen.findByPlaceholderText('Search...');
      await user.type(searchInput, 'CANADA');
      
      await waitFor(() => {
        expect(screen.getByText('Canada')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('opens dropdown with Space key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('navigates options with ArrowDown key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{ArrowDown}');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('selects option with Enter key', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Select options={mockOptions} onChange={handleChange} />);
      
      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('uk');
      });
    });
  });

  describe('Disabled State', () => {
    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} disabled />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('applies disabled styling', () => {
      render(<Select options={mockOptions} disabled />);
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveStyle({ opacity: 0.6, cursor: 'not-allowed' });
    });

    it('has negative tabIndex when disabled', () => {
      render(<Select options={mockOptions} disabled />);
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<Select label="Country" options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('sets aria-invalid when error is present', () => {
      render(<Select options={mockOptions} error="Required" />);
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });

    it('links error message with aria-describedby', () => {
      render(<Select options={mockOptions} error="Required" />);
      
      const trigger = screen.getByRole('combobox');
      const errorId = trigger.getAttribute('aria-describedby');
      
      expect(errorId).toBeTruthy();
      expect(screen.getByRole('alert')).toHaveAttribute('id', errorId);
    });

    it('marks selected option with aria-selected', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} value="ca" />);
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      const selectedOption = await screen.findByRole('option', { name: 'Canada' });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Controlled Component', () => {
    it('displays value from props', () => {
      render(<Select options={mockOptions} value="uk" />);
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('United Kingdom');
    });

    it('updates when value prop changes', () => {
      const { rerender } = render(<Select options={mockOptions} value="uk" />);
      
      let trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('United Kingdom');
      
      rerender(<Select options={mockOptions} value="ca" />);
      
      trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('Canada');
    });
  });
});
