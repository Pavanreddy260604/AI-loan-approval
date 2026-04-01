import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge Component', () => {
  describe('Tone Variant Renderings', () => {
    it('renders primary tone with correct styles', () => {
      render(<Badge tone="primary">Primary Badge</Badge>);
      const badge = screen.getByText(/primary badge/i);
      
      expect(badge).toBeInTheDocument();
      // Verify color is applied (should be a valid color string)
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.backgroundColor).toBeTruthy();
    });

    it('renders success tone with correct styles', () => {
      render(<Badge tone="success">Success Badge</Badge>);
      const badge = screen.getByText(/success badge/i);
      
      expect(badge).toBeInTheDocument();
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.backgroundColor).toBeTruthy();
    });

    it('renders warning tone with correct styles', () => {
      render(<Badge tone="warning">Warning Badge</Badge>);
      const badge = screen.getByText(/warning badge/i);
      
      expect(badge).toBeInTheDocument();
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.backgroundColor).toBeTruthy();
    });

    it('renders danger tone with correct styles', () => {
      render(<Badge tone="danger">Danger Badge</Badge>);
      const badge = screen.getByText(/danger badge/i);
      
      expect(badge).toBeInTheDocument();
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.backgroundColor).toBeTruthy();
    });

    it('renders ghost tone with correct styles', () => {
      render(<Badge tone="ghost">Ghost Badge</Badge>);
      const badge = screen.getByText(/ghost badge/i);
      
      expect(badge).toBeInTheDocument();
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.backgroundColor).toBeTruthy();
    });

    it('renders info tone with correct styles', () => {
      render(<Badge tone="info">Info Badge</Badge>);
      const badge = screen.getByText(/info badge/i);
      
      expect(badge).toBeInTheDocument();
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.backgroundColor).toBeTruthy();
    });

    it('defaults to ghost tone when no tone is specified', () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText(/default badge/i);
      
      expect(badge).toBeInTheDocument();
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.backgroundColor).toBeTruthy();
    });
  });

  describe('Size Variants', () => {
    it('renders xs size with correct height', () => {
      render(<Badge size="xs">XS Badge</Badge>);
      const badge = screen.getByText(/xs badge/i);
      
      expect(badge).toHaveStyle({ height: '20px' });
    });

    it('renders sm size with correct height (default)', () => {
      render(<Badge size="sm">SM Badge</Badge>);
      const badge = screen.getByText(/sm badge/i);
      
      expect(badge).toHaveStyle({ height: '24px' });
    });

    it('renders md size with correct height', () => {
      render(<Badge size="md">MD Badge</Badge>);
      const badge = screen.getByText(/md badge/i);
      
      expect(badge).toHaveStyle({ height: '28px' });
    });

    it('defaults to sm size when no size is specified', () => {
      render(<Badge>Default Size</Badge>);
      const badge = screen.getByText(/default size/i);
      
      expect(badge).toHaveStyle({ height: '24px' });
    });
  });

  describe('Content Rendering', () => {
    it('renders text content correctly', () => {
      render(<Badge>Active</Badge>);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders numeric content correctly', () => {
      render(<Badge>42</Badge>);
      
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with React node children', () => {
      render(
        <Badge>
          <span data-testid="icon">✓</span>
          <span>Verified</span>
        </Badge>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('renders empty badge when no children provided', () => {
      const { container } = render(<Badge />);
      const badge = container.querySelector('span');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });
  });

  describe('Styling and Layout', () => {
    it('applies inline-flex display', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      
      expect(badge).toHaveStyle({ display: 'inline-flex' });
    });

    it('applies nowrap whitespace', () => {
      render(<Badge>Long Badge Text</Badge>);
      const badge = screen.getByText('Long Badge Text');
      
      expect(badge).toHaveStyle({ whiteSpace: 'nowrap' });
    });

    it('applies border styling', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      
      // Verify border is applied
      expect(badge.style.border).toBeTruthy();
      expect(badge.style.borderColor).toBeTruthy();
    });

    it('applies custom className', () => {
      render(<Badge className="custom-class">Badge</Badge>);
      const badge = screen.getByText('Badge');
      
      expect(badge).toHaveClass('custom-class');
    });

    it('forwards ref to span element', () => {
      const ref = vi.fn();
      render(<Badge ref={ref}>Badge</Badge>);
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('Combined Variants', () => {
    it('renders primary tone with xs size', () => {
      render(<Badge tone="primary" size="xs">Small Primary</Badge>);
      const badge = screen.getByText(/small primary/i);
      
      expect(badge).toHaveStyle({ height: '20px' });
      expect(badge).toBeInTheDocument();
    });

    it('renders success tone with md size', () => {
      render(<Badge tone="success" size="md">Medium Success</Badge>);
      const badge = screen.getByText(/medium success/i);
      
      expect(badge).toHaveStyle({ height: '28px' });
      expect(badge).toBeInTheDocument();
    });

    it('renders danger tone with sm size', () => {
      render(<Badge tone="danger" size="sm">Small Danger</Badge>);
      const badge = screen.getByText(/small danger/i);
      
      expect(badge).toHaveStyle({ height: '24px' });
      expect(badge).toBeInTheDocument();
    });

    it('renders warning tone with custom className', () => {
      render(<Badge tone="warning" className="custom-warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      
      expect(badge).toHaveClass('custom-warning');
      expect(badge).toBeInTheDocument();
    });

    it('renders info tone with xs size and custom className', () => {
      render(
        <Badge tone="info" size="xs" className="info-badge">
          Info
        </Badge>
      );
      const badge = screen.getByText('Info');
      
      expect(badge).toHaveStyle({ height: '20px' });
      expect(badge).toHaveClass('info-badge');
    });
  });

  describe('Accessibility', () => {
    it('renders as a span element', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.querySelector('span');
      
      expect(badge).toBeInTheDocument();
      expect(badge?.tagName).toBe('SPAN');
    });

    it('preserves text content for screen readers', () => {
      render(<Badge>Active Status</Badge>);
      const badge = screen.getByText('Active Status');
      
      expect(badge).toHaveTextContent('Active Status');
    });
  });

  describe('Visual Consistency', () => {
    it('maintains consistent border radius across sizes', () => {
      const { rerender } = render(<Badge size="xs">XS</Badge>);
      const xsBadge = screen.getByText('XS');
      const xsBorderRadius = xsBadge.style.borderRadius;
      
      rerender(<Badge size="sm">SM</Badge>);
      const smBadge = screen.getByText('SM');
      const smBorderRadius = smBadge.style.borderRadius;
      
      rerender(<Badge size="md">MD</Badge>);
      const mdBadge = screen.getByText('MD');
      const mdBorderRadius = mdBadge.style.borderRadius;
      
      // All sizes should use the same border radius
      expect(xsBorderRadius).toBe(smBorderRadius);
      expect(smBorderRadius).toBe(mdBorderRadius);
    });

    it('applies consistent font weight across tones', () => {
      const { rerender } = render(<Badge tone="primary">Primary</Badge>);
      const primaryBadge = screen.getByText('Primary');
      const primaryFontWeight = primaryBadge.style.fontWeight;
      
      rerender(<Badge tone="success">Success</Badge>);
      const successBadge = screen.getByText('Success');
      const successFontWeight = successBadge.style.fontWeight;
      
      // All tones should use the same font weight
      expect(primaryFontWeight).toBe(successFontWeight);
    });
  });
});
