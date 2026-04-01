import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('renders title and description correctly', () => {
      render(
        <EmptyState
          title="No data found"
          description="There are no items to display."
        />
      );
      
      expect(screen.getByText('No data found')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display.')).toBeInTheDocument();
    });

    it('renders with default inbox icon', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="No items"
        />
      );
      
      // Check for SVG icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies center alignment styles', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="No items"
        />
      );
      
      const emptyState = container.firstChild as HTMLElement;
      expect(emptyState.style.display).toBe('flex');
      expect(emptyState.style.flexDirection).toBe('column');
      expect(emptyState.style.alignItems).toBe('center');
      expect(emptyState.style.textAlign).toBe('center');
    });
  });

  describe('Custom Icon', () => {
    it('renders custom icon when provided', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
      
      render(
        <EmptyState
          title="Empty"
          description="No items"
          icon={<CustomIcon />}
        />
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('does not render default icon when custom icon is provided', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
      
      const { container } = render(
        <EmptyState
          title="Empty"
          description="No items"
          icon={<CustomIcon />}
        />
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      
      // Should only have one icon (the custom one)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(0);
    });

    it('renders emoji as icon', () => {
      render(
        <EmptyState
          title="Empty"
          description="No items"
          icon={<span style={{ fontSize: '48px' }}>📭</span>}
        />
      );
      
      expect(screen.getByText('📭')).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('does not render action button by default', () => {
      render(
        <EmptyState
          title="Empty"
          description="No items"
        />
      );
      
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('renders action button when actionText and onAction are provided', () => {
      const onAction = vi.fn();
      
      render(
        <EmptyState
          title="Empty"
          description="No items"
          actionText="Add Item"
          onAction={onAction}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
    });

    it('calls onAction when action button is clicked', () => {
      const onAction = vi.fn();
      
      render(
        <EmptyState
          title="Empty"
          description="No items"
          actionText="Add Item"
          onAction={onAction}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      button.click();
      
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not render button when only actionText is provided', () => {
      render(
        <EmptyState
          title="Empty"
          description="No items"
          actionText="Add Item"
        />
      );
      
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('does not render button when only onAction is provided', () => {
      const onAction = vi.fn();
      
      render(
        <EmptyState
          title="Empty"
          description="No items"
          onAction={onAction}
        />
      );
      
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('renders button with primary variant by default', () => {
      const onAction = vi.fn();
      
      render(
        <EmptyState
          title="Empty"
          description="No items"
          actionText="Add Item"
          onAction={onAction}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
      // Button component applies primary variant styles by default
    });

    it('renders button with custom variant', () => {
      const onAction = vi.fn();
      
      render(
        <EmptyState
          title="Empty"
          description="No items"
          actionText="Add Item"
          onAction={onAction}
          actionVariant="secondary"
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="No items"
          className="custom-class"
        />
      );
      
      const emptyState = container.firstChild as HTMLElement;
      expect(emptyState.className).toContain('custom-class');
    });

    it('applies minimum height', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="No items"
        />
      );
      
      const emptyState = container.firstChild as HTMLElement;
      expect(emptyState.style.minHeight).toBe('300px');
    });

    it('applies padding using design tokens', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="No items"
        />
      );
      
      const emptyState = container.firstChild as HTMLElement;
      expect(emptyState.style.padding).toBeTruthy();
    });

    it('limits description width for readability', () => {
      render(
        <EmptyState
          title="Empty"
          description="This is a very long description that should be limited in width for better readability."
        />
      );
      
      const description = screen.getByText(/This is a very long description/);
      
      // Description should have maxWidth set
      expect(description.style.maxWidth).toBe('400px');
    });
  });

  describe('Content Variations', () => {
    it('renders short title and description', () => {
      render(
        <EmptyState
          title="Empty"
          description="No data"
        />
      );
      
      expect(screen.getByText('Empty')).toBeInTheDocument();
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('renders long title and description', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      const longDescription = 'This is a very long description that provides detailed information about why there is no data and what the user can do about it.';
      
      render(
        <EmptyState
          title={longTitle}
          description={longDescription}
        />
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('renders with all props provided', () => {
      const onAction = vi.fn();
      const CustomIcon = () => <div data-testid="custom-icon">Icon</div>;
      
      render(
        <EmptyState
          title="No loans found"
          description="Get started by creating your first loan application."
          icon={<CustomIcon />}
          actionText="Create Loan"
          onAction={onAction}
          actionVariant="primary"
          className="custom-empty-state"
        />
      );
      
      expect(screen.getByText('No loans found')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first loan application.')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Loan' })).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <EmptyState
          ref={ref}
          title="Empty"
          description="No items"
        />
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toContain('Empty');
    });
  });

  describe('Real-world Scenarios', () => {
    it('renders empty dataset state', () => {
      const onAction = vi.fn();
      
      render(
        <EmptyState
          title="No datasets found"
          description="Upload your first dataset to get started with loan predictions."
          actionText="Upload Dataset"
          onAction={onAction}
        />
      );
      
      expect(screen.getByText('No datasets found')).toBeInTheDocument();
      expect(screen.getByText('Upload your first dataset to get started with loan predictions.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Upload Dataset' })).toBeInTheDocument();
    });

    it('renders empty search results', () => {
      render(
        <EmptyState
          title="No results found"
          description="Try adjusting your search criteria or filters."
        />
      );
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria or filters.')).toBeInTheDocument();
    });

    it('renders empty loan list', () => {
      const onAction = vi.fn();
      
      render(
        <EmptyState
          title="No loans yet"
          description="Create your first loan application to start tracking."
          actionText="New Loan"
          onAction={onAction}
          actionVariant="primary"
        />
      );
      
      expect(screen.getByText('No loans yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New Loan' })).toBeInTheDocument();
    });

    it('renders empty notification list', () => {
      render(
        <EmptyState
          title="All caught up!"
          description="You have no new notifications."
          icon={<span style={{ fontSize: '48px' }}>✓</span>}
        />
      );
      
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
      expect(screen.getByText('You have no new notifications.')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      render(
        <EmptyState
          title=""
          description="Description only"
        />
      );
      
      expect(screen.getByText('Description only')).toBeInTheDocument();
    });

    it('handles empty description gracefully', () => {
      render(
        <EmptyState
          title="Title only"
          description=""
        />
      );
      
      expect(screen.getByText('Title only')).toBeInTheDocument();
    });

    it('handles multiple clicks on action button', () => {
      const onAction = vi.fn();
      
      render(
        <EmptyState
          title="Empty"
          description="No items"
          actionText="Add Item"
          onAction={onAction}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      
      button.click();
      button.click();
      button.click();
      
      expect(onAction).toHaveBeenCalledTimes(3);
    });
  });
});
