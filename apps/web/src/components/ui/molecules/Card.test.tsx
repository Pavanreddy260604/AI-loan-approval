import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('renders children content correctly', () => {
      render(<Card>Card content</Card>);
      
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with header section', () => {
      render(
        <Card header={<h3>Card Header</h3>}>
          Card body
        </Card>
      );
      
      expect(screen.getByText('Card Header')).toBeInTheDocument();
      expect(screen.getByText('Card body')).toBeInTheDocument();
    });

    it('renders with footer section', () => {
      render(
        <Card footer={<button>Action</button>}>
          Card body
        </Card>
      );
      
      expect(screen.getByText('Card body')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders with header, body, and footer', () => {
      render(
        <Card 
          header={<h3>Header</h3>}
          footer={<button>Footer</button>}
        >
          Body content
        </Card>
      );
      
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Padding Option', () => {
    it('applies padding by default', () => {
      const { container } = render(<Card>Content</Card>);
      const bodyDiv = container.querySelector('div > div:last-child') as HTMLElement;
      
      expect(bodyDiv).toHaveStyle({ padding: expect.any(String) });
      expect(bodyDiv.style.padding).not.toBe('0');
    });

    it('removes padding when padded is false', () => {
      const { container } = render(<Card padded={false}>Content</Card>);
      const bodyDiv = container.querySelector('div > div') as HTMLElement;
      
      // Padding should be minimal or not set (React may not render '0px' in style attribute)
      const paddingValue = bodyDiv.style.padding;
      expect(paddingValue === '0px' || paddingValue === '' || paddingValue === '0').toBe(true);
    });

    it('applies padding to header when padded is true', () => {
      const { container } = render(
        <Card header={<h3>Header</h3>} padded>
          Content
        </Card>
      );
      const headerDiv = container.querySelector('div > div:first-child') as HTMLElement;
      
      expect(headerDiv.style.padding).not.toBe('0');
    });

    it('applies padding to footer when padded is true', () => {
      const { container } = render(
        <Card footer={<button>Footer</button>} padded>
          Content
        </Card>
      );
      const footerDiv = container.querySelector('div > div:last-child') as HTMLElement;
      
      expect(footerDiv.style.padding).not.toBe('0');
    });
  });

  describe('Border Option', () => {
    it('shows border by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.border).toBeTruthy();
    });

    it('hides border when border is false', () => {
      const { container } = render(<Card border={false}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.border).toBeFalsy();
    });

    it('shows border when border is true', () => {
      const { container } = render(<Card border={true}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.border).toBeTruthy();
    });
  });

  describe('Hoverable Option', () => {
    it('does not apply cursor pointer by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.cursor).not.toBe('pointer');
    });

    it('applies cursor pointer when hoverable is true', () => {
      const { container } = render(<Card hoverable>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.cursor).toBe('pointer');
    });

    it('applies hover effects on mouse enter', async () => {
      const user = userEvent.setup();
      const { container } = render(<Card hoverable>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      // Initial state - no transform
      expect(card.style.transform).toBe('');
      
      // Hover state
      await user.hover(card);
      
      // Should have transform applied
      expect(card.style.transform).toBeTruthy();
      expect(card.style.boxShadow).toBeTruthy();
    });

    it('removes hover effects on mouse leave', async () => {
      const user = userEvent.setup();
      const { container } = render(<Card hoverable>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      // Hover
      await user.hover(card);
      expect(card.style.transform).toBeTruthy();
      
      // Unhover
      await user.unhover(card);
      expect(card.style.transform).toBe('');
    });

    it('does not apply hover effects when hoverable is false', async () => {
      const user = userEvent.setup();
      const { container } = render(<Card hoverable={false}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      await user.hover(card);
      
      expect(card.style.transform).toBe('');
    });
  });

  describe('Styling and Layout', () => {
    it('applies flex column layout', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card).toHaveStyle({ 
        display: 'flex',
        flexDirection: 'column'
      });
    });

    it('applies overflow hidden', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card).toHaveStyle({ overflow: 'hidden' });
    });

    it('applies border radius', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.borderRadius).toBeTruthy();
    });

    it('applies background color', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.backgroundColor).toBeTruthy();
    });

    it('applies transition', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.transition).toBeTruthy();
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('Section Borders', () => {
    it('applies border to header when present', () => {
      const { container } = render(
        <Card header={<h3>Header</h3>}>
          Content
        </Card>
      );
      const headerDiv = container.querySelector('div > div:first-child') as HTMLElement;
      
      expect(headerDiv.style.borderBottom).toBeTruthy();
    });

    it('applies border to footer when present', () => {
      const { container } = render(
        <Card footer={<button>Footer</button>}>
          Content
        </Card>
      );
      const footerDiv = container.querySelector('div > div:last-child') as HTMLElement;
      
      expect(footerDiv.style.borderTop).toBeTruthy();
    });

    it('does not render header div when header is not provided', () => {
      const { container } = render(<Card>Content</Card>);
      const cardDiv = container.firstChild as HTMLElement;
      const divs = cardDiv.querySelectorAll(':scope > div');
      
      // Should only have body div
      expect(divs.length).toBe(1);
    });

    it('does not render footer div when footer is not provided', () => {
      const { container } = render(<Card>Content</Card>);
      const cardDiv = container.firstChild as HTMLElement;
      const divs = cardDiv.querySelectorAll(':scope > div');
      
      // Should only have body div
      expect(divs.length).toBe(1);
    });
  });

  describe('Combined Options', () => {
    it('renders with all options enabled', () => {
      const { container } = render(
        <Card 
          header={<h3>Header</h3>}
          footer={<button>Footer</button>}
          hoverable
          padded
          border
          className="custom-card"
        >
          Content
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      
      expect(card).toHaveClass('custom-card');
      expect(card.style.cursor).toBe('pointer');
      expect(card.style.border).toBeTruthy();
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('renders with all options disabled', () => {
      const { container } = render(
        <Card 
          hoverable={false}
          padded={false}
          border={false}
        >
          Content
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      const bodyDiv = container.querySelector('div > div') as HTMLElement;
      
      expect(card.style.cursor).not.toBe('pointer');
      expect(card.style.border).toBeFalsy();
      // Padding should be minimal or not set
      const paddingValue = bodyDiv.style.padding;
      expect(paddingValue === '0px' || paddingValue === '' || paddingValue === '0').toBe(true);
    });

    it('renders hoverable card without border', () => {
      const { container } = render(
        <Card hoverable border={false}>
          Content
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      
      expect(card.style.cursor).toBe('pointer');
      expect(card.style.border).toBeFalsy();
    });

    it('renders bordered card without padding', () => {
      const { container } = render(
        <Card border padded={false}>
          Content
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      const bodyDiv = container.querySelector('div > div') as HTMLElement;
      
      expect(card.style.border).toBeTruthy();
      // Padding should be minimal or not set
      const paddingValue = bodyDiv.style.padding;
      expect(paddingValue === '0px' || paddingValue === '' || paddingValue === '0').toBe(true);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to div element', () => {
      const ref = vi.fn();
      render(<Card ref={ref}>Content</Card>);
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });

    it('allows ref access to card element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe('Content');
    });
  });

  describe('Complex Content', () => {
    it('renders complex header with multiple elements', () => {
      render(
        <Card 
          header={
            <div>
              <h3>Title</h3>
              <p>Subtitle</p>
            </div>
          }
        >
          Content
        </Card>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });

    it('renders complex footer with multiple buttons', () => {
      render(
        <Card 
          footer={
            <div>
              <button>Cancel</button>
              <button>Save</button>
            </div>
          }
        >
          Content
        </Card>
      );
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('renders complex body with nested components', () => {
      render(
        <Card>
          <div>
            <h4>Section 1</h4>
            <p>Paragraph 1</p>
            <h4>Section 2</h4>
            <p>Paragraph 2</p>
          </div>
        </Card>
      );
      
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });
});
