import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Radio } from './Radio';

describe('Radio', () => {
  it('renders with label', () => {
    render(<Radio label="Option A" name="test" value="a" />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('handles checked state', () => {
    render(<Radio label="Test" name="test" value="a" checked={true} readOnly />);
    const radio = screen.getByRole('radio');
    expect(radio).toBeChecked();
  });

  it('handles unchecked state', () => {
    render(<Radio label="Test" name="test" value="a" checked={false} readOnly />);
    const radio = screen.getByRole('radio');
    expect(radio).not.toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Radio label="Test" name="test" value="a" onChange={handleChange} />);
    
    const label = screen.getByText('Test');
    await user.click(label);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('displays error message', () => {
    render(<Radio label="Test" name="test" value="a" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays hint text', () => {
    render(<Radio label="Test" name="test" value="a" hint="Select one option" />);
    expect(screen.getByText('Select one option')).toBeInTheDocument();
  });

  it('respects disabled state', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Radio label="Test" name="test" value="a" disabled onChange={handleChange} />);
    
    const radio = screen.getByRole('radio');
    expect(radio).toBeDisabled();
    
    // Try clicking the label - should not trigger onChange when disabled
    const label = screen.getByText('Test');
    await user.click(label);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<Radio label="Test" name="test" value="a" error="Error message" />);
    const radio = screen.getByRole('radio');
    
    expect(radio).toHaveAttribute('aria-invalid', 'true');
    expect(radio).toHaveAttribute('aria-describedby');
  });

  it('renders without label', () => {
    render(<Radio name="test" value="a" aria-label="Test radio" />);
    const radio = screen.getByRole('radio');
    expect(radio).toBeInTheDocument();
  });

  it('works in a radio group', () => {
    render(
      <>
        <Radio label="Option A" name="group" value="a" checked={true} readOnly />
        <Radio label="Option B" name="group" value="b" checked={false} readOnly />
      </>
    );
    
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });
});
