import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../atoms/Button';

/**
 * Modal Component Demo
 * 
 * Demonstrates all Modal component variants and features.
 */
export const ModalDemo: React.FC = () => {
  const [basicOpen, setBasicOpen] = useState(false);
  const [withTitleOpen, setWithTitleOpen] = useState(false);
  const [withFooterOpen, setWithFooterOpen] = useState(false);
  const [smallOpen, setSmallOpen] = useState(false);
  const [largeOpen, setLargeOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [noOverlayCloseOpen, setNoOverlayCloseOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1>Modal Component Demo</h1>

      <section>
        <h2>Basic Modal</h2>
        <Button onClick={() => setBasicOpen(true)}>Open Basic Modal</Button>
        <Modal open={basicOpen} onClose={() => setBasicOpen(false)}>
          <p>This is a basic modal with just content and a close button.</p>
          <p>Click the X button, press Escape, or click outside to close.</p>
        </Modal>
      </section>

      <section>
        <h2>Modal with Title</h2>
        <Button onClick={() => setWithTitleOpen(true)}>Open Modal with Title</Button>
        <Modal
          open={withTitleOpen}
          onClose={() => setWithTitleOpen(false)}
          title="Modal Title"
        >
          <p>This modal has a title in the header.</p>
          <p>The title helps users understand the purpose of the modal.</p>
        </Modal>
      </section>

      <section>
        <h2>Modal with Footer</h2>
        <Button onClick={() => setWithFooterOpen(true)}>Open Modal with Footer</Button>
        <Modal
          open={withFooterOpen}
          onClose={() => setWithFooterOpen(false)}
          title="Modal with Actions"
          footer={
            <>
              <Button variant="ghost" onClick={() => setWithFooterOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setWithFooterOpen(false)}>
                Save
              </Button>
            </>
          }
        >
          <p>This modal has action buttons in the footer.</p>
          <p>Common pattern for forms and confirmations.</p>
        </Modal>
      </section>

      <section>
        <h2>Size Variants</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button onClick={() => setSmallOpen(true)}>Small (sm)</Button>
          <Button onClick={() => setBasicOpen(true)}>Medium (md - default)</Button>
          <Button onClick={() => setLargeOpen(true)}>Large (lg)</Button>
          <Button onClick={() => setFullOpen(true)}>Full</Button>
        </div>

        <Modal
          open={smallOpen}
          onClose={() => setSmallOpen(false)}
          title="Small Modal"
          size="sm"
        >
          <p>This is a small modal (400px max width).</p>
          <p>Good for simple confirmations or alerts.</p>
        </Modal>

        <Modal
          open={largeOpen}
          onClose={() => setLargeOpen(false)}
          title="Large Modal"
          size="lg"
        >
          <p>This is a large modal (800px max width).</p>
          <p>Good for forms with many fields or detailed content.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </Modal>

        <Modal
          open={fullOpen}
          onClose={() => setFullOpen(false)}
          title="Full Width Modal"
          size="full"
        >
          <p>This is a full-width modal (95vw).</p>
          <p>Good for complex interfaces or data tables.</p>
          <div style={{ height: '400px', background: '#27272a', borderRadius: '8px', padding: '1rem' }}>
            <p>Large content area</p>
          </div>
        </Modal>
      </section>

      <section>
        <h2>Prevent Overlay Close</h2>
        <Button onClick={() => setNoOverlayCloseOpen(true)}>
          Open Modal (No Overlay Close)
        </Button>
        <Modal
          open={noOverlayCloseOpen}
          onClose={() => setNoOverlayCloseOpen(false)}
          title="Important Action"
          closeOnOverlayClick={false}
        >
          <p>This modal cannot be closed by clicking the overlay.</p>
          <p>You must use the close button or press Escape.</p>
          <p>Useful for important actions that require explicit confirmation.</p>
          <div style={{ marginTop: '1rem' }}>
            <Button onClick={() => setNoOverlayCloseOpen(false)}>
              Close Modal
            </Button>
          </div>
        </Modal>
      </section>

      <section>
        <h2>Confirmation Dialog Pattern</h2>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Delete Item
        </Button>
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Confirm Deletion"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  alert('Item deleted!');
                  setConfirmOpen(false);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p>Are you sure you want to delete this item?</p>
          <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>
            This action cannot be undone.
          </p>
        </Modal>
      </section>

      <section>
        <h2>Scrollable Content</h2>
        <Button onClick={() => setBasicOpen(true)}>Open Scrollable Modal</Button>
        <Modal
          open={basicOpen}
          onClose={() => setBasicOpen(false)}
          title="Long Content"
        >
          <p>This modal has scrollable content when it exceeds the viewport height.</p>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>
              Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </Modal>
      </section>

      <section>
        <h2>Accessibility Features</h2>
        <ul>
          <li>Focus trap - Tab key cycles through focusable elements within modal</li>
          <li>Escape key closes the modal</li>
          <li>Focus returns to trigger element when closed</li>
          <li>Body scroll is locked when modal is open</li>
          <li>Proper ARIA attributes (role="dialog", aria-modal, aria-labelledby)</li>
          <li>Keyboard navigation support</li>
        </ul>
      </section>
    </div>
  );
};

export default ModalDemo;
