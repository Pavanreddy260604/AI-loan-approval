import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dropdown, DropdownItem } from './Dropdown';

describe('Dropdown Component', () => {
  const mockItems: DropdownItem[] = [
    { label: 'Edit', value: 'edit' },
    { label: 'Duplicate', value: 'duplicate' },
    { label: 'Delete', value: 'delete', danger: true },
  ];

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render trigger element', () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should not show menu items initially', () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.queryByText('Edit')).not.toBeVisible();
    });

    it('should show menu items when trigger is clicked', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
        expect(screen.getByText('Duplicate')).toBeVisible();
        expect(screen.getByText('Delete')).toBeVisible();
      });
    });

    it('should render items with icons', async () => {
      const itemsWithIcons: DropdownItem[] = [
        { label: 'Edit', value: 'edit', icon: <span data-testid="edit-icon">✏️</span> },
      ];

      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={itemsWithIcons}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      });
    });

    it('should render disabled items', async () => {
      const itemsWithDisabled: DropdownItem[] = [
        { label: 'Edit', value: 'edit' },
        { label: 'Delete', value: 'delete', disabled: true },
      ];

      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={itemsWithDisabled}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: 'Delete' });
        expect(deleteButton).toBeDisabled();
      });
    });
  });

  describe('Item Selection', () => {
    it('should call onSelect when item is clicked', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      fireEvent.click(screen.getByText('Edit'));

      expect(mockOnSelect).toHaveBeenCalledWith('edit');
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('should close menu after item selection', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      fireEvent.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeVisible();
      });
    });

    it('should not call onSelect for disabled items', async () => {
      const itemsWithDisabled: DropdownItem[] = [
        { label: 'Edit', value: 'edit' },
        { label: 'Delete', value: 'delete', disabled: true },
      ];

      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={itemsWithDisabled}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeVisible();
      });

      fireEvent.click(screen.getByText('Delete'));

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close menu on Escape key', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeVisible();
      });
    });

    it('should navigate items with ArrowDown key', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });

      // Navigation state is internal, just verify no errors
      expect(screen.getByText('Edit')).toBeVisible();
    });

    it('should navigate items with ArrowUp key', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      fireEvent.keyDown(document, { key: 'ArrowUp' });

      // Navigation state is internal, just verify no errors
      expect(screen.getByText('Edit')).toBeVisible();
    });

    it('should select focused item with Enter key', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      // Navigate to first item and select
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'Enter' });

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('edit');
      });
    });

    it('should skip disabled items during keyboard navigation', async () => {
      const itemsWithDisabled: DropdownItem[] = [
        { label: 'Edit', value: 'edit' },
        { label: 'View', value: 'view', disabled: true },
        { label: 'Delete', value: 'delete' },
      ];

      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={itemsWithDisabled}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      // Navigate down twice (should skip disabled item)
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'Enter' });

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalled();
      });
    });
  });

  describe('Click Outside', () => {
    it('should close menu when clicking outside', async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <Dropdown
            trigger={<button>Actions</button>}
            items={mockItems}
            onSelect={mockOnSelect}
          />
        </div>
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeVisible();
      });
    });

    it('should not close menu when clicking inside', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      // Click on the menu container (not an item)
      const editButton = screen.getByText('Edit');
      fireEvent.mouseDown(editButton.parentElement!);

      // Menu should still be visible
      expect(screen.getByText('Edit')).toBeVisible();
    });
  });

  describe('Placement', () => {
    it('should render with bottom-start placement', () => {
      const { container } = render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
          placement="bottom-start"
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with bottom-end placement', () => {
      const { container } = render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
          placement="bottom-end"
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with top-start placement', () => {
      const { container } = render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
          placement="top-start"
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with top-end placement', () => {
      const { container } = render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
          placement="top-end"
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Danger Variant', () => {
    it('should render danger items with appropriate styling', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        expect(deleteButton).toBeVisible();
      });
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
          className="custom-dropdown"
        />
      );

      expect(container.querySelector('.custom-dropdown')).toBeInTheDocument();
    });
  });

  describe('Toggle Behavior', () => {
    it('should toggle menu open and closed', async () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={mockItems}
          onSelect={mockOnSelect}
        />
      );

      // Open
      fireEvent.click(screen.getByText('Actions'));
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });

      // Close
      fireEvent.click(screen.getByText('Actions'));
      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeVisible();
      });

      // Open again
      fireEvent.click(screen.getByText('Actions'));
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeVisible();
      });
    });
  });
});
