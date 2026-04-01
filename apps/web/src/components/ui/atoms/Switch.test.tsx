import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders with label', () => {
    render(<Switch label="Enable notifications" />);
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
  });

  it('handles checked state', () => {
    render(<Switch label="Test" checked={true} readOnly />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
  });

  it('handles unchecked state', () => {
    render(<Switch label="Test" checked={false} readOnly />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Switch label="Test" onChange={handleChange} />);
    
    const label = screen.getByText('Test');
    await user.click(label);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('displays error message', () => {
    render(<Switch label="Test" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays hint text', () => {
    render(<Switch label="Test" hint="Toggle to enable" />);
    expect(screen.getByText('Toggle to enable')).toBeInTheDocument();
  });

  it('respects disabled state', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Switch label="Test" disabled onChange={handleChange} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
    
    // Try clicking the label - should not trigger onChange when disabled
    const label = screen.getByText('Test');
    await user.click(label);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<Switch label="Test" error="Error message" checked={true} readOnly />);
    const switchElement = screen.getByRole('switch');
    
    expect(switchElement).toHaveAttribute('aria-invalid', 'true');
    expect(switchElement).toHaveAttribute('aria-describedby');
  });

  it('renders without label', () => {
    render(<Switch aria-label="Test switch" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });

  it('supports different sizes', () => {
    const { rerender } = render(<Switch label="Test" size="sm" />);
    let switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();

    rerender(<Switch label="Test" size="md" />);
    switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();

    rerender(<Switch label="Test" size="lg" />);
    switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });
});
