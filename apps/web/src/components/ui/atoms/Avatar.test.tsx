import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar Component', () => {
  describe('Image Display', () => {
    it('renders image when src is provided and loads successfully', async () => {
      render(<Avatar src="/test-avatar.jpg" alt="Test User" />);
      
      const avatar = screen.getByRole('img', { name: /test user/i });
      expect(avatar).toBeInTheDocument();
      
      const img = avatar.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/test-avatar.jpg');
      expect(img).toHaveAttribute('alt', 'Test User');
    });

    it('shows skeleton loader while image is loading', () => {
      render(<Avatar src="/test-avatar.jpg" alt="Test User" />);
      
      const avatar = screen.getByRole('img');
      const skeleton = avatar.querySelector('div[aria-hidden="true"]');
      
      expect(skeleton).toBeInTheDocument();
    });

    it('hides skeleton and shows image after load', async () => {
      render(<Avatar src="/test-avatar.jpg" alt="Test User" />);
      
      const avatar = screen.getByRole('img');
      const img = avatar.querySelector('img') as HTMLImageElement;
      
      // Simulate image load
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(img).toHaveStyle({ display: 'block' });
      });
    });

    it('falls back to initials when image fails to load', async () => {
      render(<Avatar src="/broken-image.jpg" alt="Test User" initials="TU" />);
      
      const avatar = screen.getByRole('img');
      const img = avatar.querySelector('img') as HTMLImageElement;
      
      // Simulate image error
      fireEvent.error(img);
      
      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument();
      });
    });

    it('uses default alt text when not provided', () => {
      render(<Avatar src="/test-avatar.jpg" />);
      
      const avatar = screen.getByRole('img', { name: /avatar/i });
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Fallback Initials', () => {
    it('displays initials when no src is provided', () => {
      render(<Avatar initials="JD" />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('displays initials when image fails to load', async () => {
      render(<Avatar src="/broken.jpg" initials="AB" />);
      
      const avatar = screen.getByRole('img');
      const img = avatar.querySelector('img') as HTMLImageElement;
      
      // Simulate image error
      fireEvent.error(img);
      
      await waitFor(() => {
        expect(screen.getByText('AB')).toBeInTheDocument();
      });
    });

    it('does not display initials when image loads successfully', async () => {
      render(<Avatar src="/test.jpg" initials="JD" />);
      
      const avatar = screen.getByRole('img');
      const img = avatar.querySelector('img') as HTMLImageElement;
      
      // Simulate image load
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(screen.queryByText('JD')).not.toBeInTheDocument();
      });
    });

    it('renders without initials when neither src nor initials provided', () => {
      render(<Avatar />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
      expect(avatar.textContent).toBe('');
    });
  });

  describe('Size Variants', () => {
    it('renders xs size with correct dimensions', () => {
      render(<Avatar initials="XS" size="xs" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        width: '24px',
        height: '24px',
      });
    });

    it('renders sm size with correct dimensions', () => {
      render(<Avatar initials="SM" size="sm" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        width: '32px',
        height: '32px',
      });
    });

    it('renders md size with correct dimensions (default)', () => {
      render(<Avatar initials="MD" size="md" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        width: '40px',
        height: '40px',
      });
    });

    it('renders lg size with correct dimensions', () => {
      render(<Avatar initials="LG" size="lg" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        width: '48px',
        height: '48px',
      });
    });

    it('renders xl size with correct dimensions', () => {
      render(<Avatar initials="XL" size="xl" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        width: '64px',
        height: '64px',
      });
    });

    it('defaults to md size when no size is specified', () => {
      render(<Avatar initials="MD" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        width: '40px',
        height: '40px',
      });
    });
  });

  describe('Loading State', () => {
    it('shows skeleton loader when loading is true', () => {
      render(<Avatar loading />);
      
      const avatar = screen.getByRole('img');
      const skeleton = avatar.querySelector('div[aria-hidden="true"]');
      
      expect(skeleton).toBeInTheDocument();
    });

    it('hides initials when loading', () => {
      render(<Avatar initials="JD" loading />);
      
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });

    it('hides image when loading', () => {
      render(<Avatar src="/test.jpg" loading />);
      
      const avatar = screen.getByRole('img');
      const img = avatar.querySelector('img');
      
      expect(img).toHaveStyle({ display: 'none' });
    });

    it('shows content after loading completes', async () => {
      const { rerender } = render(<Avatar initials="JD" loading />);
      
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
      
      rerender(<Avatar initials="JD" loading={false} />);
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Styling and Appearance', () => {
    it('applies custom className', () => {
      render(<Avatar initials="JD" className="custom-avatar" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveClass('custom-avatar');
    });

    it('has circular border radius', () => {
      render(<Avatar initials="JD" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        borderRadius: expect.stringContaining('9999px'),
      });
    });

    it('has proper background color', () => {
      render(<Avatar initials="JD" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        backgroundColor: expect.any(String),
      });
    });

    it('centers content', () => {
      render(<Avatar initials="JD" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toHaveStyle({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });
  });

  describe('Image State Management', () => {
    it('resets image state when src changes', async () => {
      const { rerender } = render(<Avatar src="/image1.jpg" initials="JD" />);
      
      const avatar = screen.getByRole('img');
      let img = avatar.querySelector('img') as HTMLImageElement;
      
      // Load first image
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(img).toHaveStyle({ display: 'block' });
      });
      
      // Change src
      rerender(<Avatar src="/image2.jpg" initials="JD" />);
      
      img = avatar.querySelector('img') as HTMLImageElement;
      
      // Should show skeleton again while new image loads
      const skeleton = avatar.querySelector('div[aria-hidden="true"]');
      expect(skeleton).toBeInTheDocument();
    });

    it('handles multiple load/error cycles', async () => {
      const { rerender } = render(<Avatar src="/image1.jpg" initials="JD" />);
      
      const avatar = screen.getByRole('img');
      let img = avatar.querySelector('img') as HTMLImageElement;
      
      // First load fails
      fireEvent.error(img);
      
      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument();
      });
      
      // Change to new image
      rerender(<Avatar src="/image2.jpg" initials="JD" />);
      
      img = avatar.querySelector('img') as HTMLImageElement;
      
      // Second load succeeds
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(screen.queryByText('JD')).not.toBeInTheDocument();
        expect(img).toHaveStyle({ display: 'block' });
      });
    });
  });

  describe('Accessibility', () => {
    it('has role="img"', () => {
      render(<Avatar initials="JD" />);
      const avatar = screen.getByRole('img');
      
      expect(avatar).toBeInTheDocument();
    });

    it('has aria-label with alt text', () => {
      render(<Avatar alt="John Doe" initials="JD" />);
      const avatar = screen.getByRole('img', { name: /john doe/i });
      
      expect(avatar).toBeInTheDocument();
    });

    it('skeleton has aria-hidden="true"', () => {
      render(<Avatar loading />);
      const avatar = screen.getByRole('img');
      const skeleton = avatar.querySelector('div[aria-hidden="true"]');
      
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to avatar container', () => {
      const ref = vi.fn();
      render(<Avatar ref={ref} initials="JD" />);
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Combined States', () => {
    it('renders large avatar with image', async () => {
      render(<Avatar src="/test.jpg" alt="User" size="lg" />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveStyle({
        width: '48px',
        height: '48px',
      });
      
      const img = avatar.querySelector('img');
      expect(img).toHaveAttribute('src', '/test.jpg');
    });

    it('renders small avatar with initials', () => {
      render(<Avatar initials="AB" size="sm" />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveStyle({
        width: '32px',
        height: '32px',
      });
      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('renders extra large loading avatar', () => {
      render(<Avatar loading size="xl" />);
      
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveStyle({
        width: '64px',
        height: '64px',
      });
      
      const skeleton = avatar.querySelector('div[aria-hidden="true"]');
      expect(skeleton).toBeInTheDocument();
    });
  });
});
