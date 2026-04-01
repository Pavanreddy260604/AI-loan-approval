import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
  });

  it('renders with custom label', () => {
    render(<Spinner label="Processing data..." />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Processing data...');
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  it('renders all size variants', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach((size) => {
      const { container } = render(<Spinner size={size} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('renders all color variants', () => {
    const colors = ['primary', 'success', 'warning', 'danger', 'info', 'base'] as const;
    
    colors.forEach((color) => {
      const { container } = render(<Spinner color={color} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('has correct size dimensions', () => {
    const { container: xsContainer } = render(<Spinner size="xs" />);
    const xsSvg = xsContainer.querySelector('svg');
    expect(xsSvg).toHaveAttribute('width', '12');
    expect(xsSvg).toHaveAttribute('height', '12');

    const { container: mdContainer } = render(<Spinner size="md" />);
    const mdSvg = mdContainer.querySelector('svg');
    expect(mdSvg).toHaveAttribute('width', '20');
    expect(mdSvg).toHaveAttribute('height', '20');

    const { container: xlContainer } = render(<Spinner size="xl" />);
    const xlSvg = xlContainer.querySelector('svg');
    expect(xlSvg).toHaveAttribute('width', '32');
    expect(xlSvg).toHaveAttribute('height', '32');
  });

  it('has animate-spin class for animation', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('includes screen reader text', () => {
    render(<Spinner label="Loading content" />);
    const srText = screen.getByText('Loading content');
    expect(srText).toHaveClass('sr-only');
  });
});
