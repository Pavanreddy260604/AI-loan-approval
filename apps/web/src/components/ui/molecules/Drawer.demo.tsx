import React, { useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';

/**
 * Drawer Component Demo
 * 
 * Visual demonstration of all Drawer variants and options.
 * This file serves as both documentation and manual testing.
 */
export const DrawerDemo: React.FC = () => {
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [topDrawerOpen, setTopDrawerOpen] = useState(false);
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState(false);
  const [smDrawerOpen, setSmDrawerOpen] = useState(false);
  const [mdDrawerOpen, setMdDrawerOpen] = useState(false);
  const [lgDrawerOpen, setLgDrawerOpen] = useState(false);
  const [fullDrawerOpen, setFullDrawerOpen] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [noOverlayCloseDrawerOpen, setNoOverlayCloseDrawerOpen] = useState(false);

  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>Drawer Component Demo</h1>

      {/* Direction Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Direction Variants</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => setRightDrawerOpen(true)}>
            Open Right Drawer (Default)
          </Button>
          <Button variant="primary" onClick={() => setLeftDrawerOpen(true)}>
            Open Left Drawer
          </Button>
          <Button variant="primary" onClick={() => setTopDrawerOpen(true)}>
            Open Top Drawer
          </Button>
          <Button variant="primary" onClick={() => setBottomDrawerOpen(true)}>
            Open Bottom Drawer
          </Button>
        </div>
      </section>

      {/* Size Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Size Variants</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setSmDrawerOpen(true)}>
            Small Drawer (320px)
          </Button>
          <Button variant="secondary" onClick={() => setMdDrawerOpen(true)}>
            Medium Drawer (480px)
          </Button>
          <Button variant="secondary" onClick={() => setLgDrawerOpen(true)}>
            Large Drawer (640px)
          </Button>
          <Button variant="secondary" onClick={() => setFullDrawerOpen(true)}>
            Full Width Drawer
          </Button>
        </div>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Real-world Examples</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => setFormDrawerOpen(true)}>
            Form Drawer
          </Button>
          <Button variant="outline" onClick={() => setSettingsDrawerOpen(true)}>
            Settings Drawer
          </Button>
          <Button variant="outline" onClick={() => setNotificationsDrawerOpen(true)}>
            Notifications Drawer
          </Button>
        </div>
      </section>

      {/* Special Options */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Special Options</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={() => setNoOverlayCloseDrawerOpen(true)}>
            No Overlay Close
          </Button>
        </div>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginTop: '8px' }}>
          Try clicking the overlay - it won't close the drawer
        </p>
      </section>

      {/* Direction Drawers */}
      <Drawer
        open={rightDrawerOpen}
        onClose={() => setRightDrawerOpen(false)}
        direction="right"
        title="Right Drawer"
      >
        <p style={{ color: '#d4d4d8' }}>
          This drawer slides in from the right side of the screen.
        </p>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
          Press Escape or click the overlay to close.
        </p>
      </Drawer>

      <Drawer
        open={leftDrawerOpen}
        onClose={() => setLeftDrawerOpen(false)}
        direction="left"
        title="Left Drawer"
      >
        <p style={{ color: '#d4d4d8' }}>
          This drawer slides in from the left side of the screen.
        </p>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
          Press Escape or click the overlay to close.
        </p>
      </Drawer>

      <Drawer
        open={topDrawerOpen}
        onClose={() => setTopDrawerOpen(false)}
        direction="top"
        title="Top Drawer"
      >
        <p style={{ color: '#d4d4d8' }}>
          This drawer slides in from the top of the screen.
        </p>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
          Press Escape or click the overlay to close.
        </p>
      </Drawer>

      <Drawer
        open={bottomDrawerOpen}
        onClose={() => setBottomDrawerOpen(false)}
        direction="bottom"
        title="Bottom Drawer"
      >
        <p style={{ color: '#d4d4d8' }}>
          This drawer slides in from the bottom of the screen.
        </p>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
          Press Escape or click the overlay to close.
        </p>
      </Drawer>

      {/* Size Drawers */}
      <Drawer
        open={smDrawerOpen}
        onClose={() => setSmDrawerOpen(false)}
        size="sm"
        title="Small Drawer"
      >
        <p style={{ color: '#d4d4d8' }}>
          This is a small drawer (320px wide).
        </p>
      </Drawer>

      <Drawer
        open={mdDrawerOpen}
        onClose={() => setMdDrawerOpen(false)}
        size="md"
        title="Medium Drawer"
      >
        <p style={{ color: '#d4d4d8' }}>
          This is a medium drawer (480px wide).
        </p>
      </Drawer>

      <Drawer
        open={lgDrawerOpen}
        onClose={() => setLgDrawerOpen(false)}
        size="lg"
        title="Large Drawer"
      >
        <p style={{ color: '#d4d4d8' }}>
          This is a large drawer (640px wide).
        </p>
      </Drawer>

      <Drawer
        open={fullDrawerOpen}
        onClose={() => setFullDrawerOpen(false)}
        size="full"
        title="Full Width Drawer"
      >
        <p style={{ color: '#d4d4d8' }}>
          This drawer takes up the full width of the screen.
        </p>
      </Drawer>

      {/* Form Drawer */}
      <Drawer
        open={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        title="Create New Loan Application"
        size="lg"
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', color: '#d4d4d8', marginBottom: '8px', fontSize: '0.875rem' }}>
              Applicant Name
            </label>
            <Input placeholder="Enter full name" />
          </div>

          <div>
            <label style={{ display: 'block', color: '#d4d4d8', marginBottom: '8px', fontSize: '0.875rem' }}>
              Email Address
            </label>
            <Input type="email" placeholder="applicant@example.com" />
          </div>

          <div>
            <label style={{ display: 'block', color: '#d4d4d8', marginBottom: '8px', fontSize: '0.875rem' }}>
              Loan Amount
            </label>
            <Input type="number" placeholder="250000" />
          </div>

          <div>
            <label style={{ display: 'block', color: '#d4d4d8', marginBottom: '8px', fontSize: '0.875rem' }}>
              Loan Type
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#d4d4d8',
                fontSize: '1rem',
              }}
            >
              <option>Home Mortgage</option>
              <option>Auto Loan</option>
              <option>Personal Loan</option>
              <option>Business Loan</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: '#d4d4d8', marginBottom: '8px', fontSize: '0.875rem' }}>
              Additional Notes
            </label>
            <textarea
              rows={4}
              placeholder="Enter any additional information..."
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#d4d4d8',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setFormDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Application
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Settings Drawer */}
      <Drawer
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        title="Settings"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Account Section */}
          <div>
            <h3 style={{ color: '#fafafa', fontSize: '1.125rem', marginBottom: '16px' }}>Account</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#d4d4d8', margin: 0 }}>Email Notifications</p>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    Receive email updates about your applications
                  </p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#d4d4d8', margin: 0 }}>Two-Factor Authentication</p>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    Add an extra layer of security
                  </p>
                </div>
                <Badge tone="success" size="xs">Enabled</Badge>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div>
            <h3 style={{ color: '#fafafa', fontSize: '1.125rem', marginBottom: '16px' }}>Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#d4d4d8', marginBottom: '8px', fontSize: '0.875rem' }}>
                  Language
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#d4d4d8',
                    fontSize: '1rem',
                  }}
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#d4d4d8', marginBottom: '8px', fontSize: '0.875rem' }}>
                  Timezone
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#d4d4d8',
                    fontSize: '1rem',
                  }}
                >
                  <option>UTC-8 (Pacific Time)</option>
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+1 (CET)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h3 style={{ color: '#ef4444', fontSize: '1.125rem', marginBottom: '16px' }}>Danger Zone</h3>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#7f1d1d20', 
              border: '1px solid #7f1d1d',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#d4d4d8', margin: '0 0 12px 0' }}>Delete Account</p>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 16px 0' }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="danger" size="sm">
                Delete Account
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
            <Button variant="ghost" onClick={() => setSettingsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Changes
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Notifications Drawer */}
      <Drawer
        open={notificationsDrawerOpen}
        onClose={() => setNotificationsDrawerOpen(false)}
        title="Notifications"
        direction="right"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Notification Item */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#18181b', 
            borderRadius: '8px',
            borderLeft: '3px solid #635BFF'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
              <Badge tone="primary" size="xs">New</Badge>
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>5m ago</span>
            </div>
            <p style={{ color: '#fafafa', margin: '0 0 4px 0', fontWeight: 500 }}>
              New loan application
            </p>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
              Application #12346 from Michael Johnson
            </p>
          </div>

          {/* Notification Item */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#18181b', 
            borderRadius: '8px',
            borderLeft: '3px solid #10b981'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
              <Badge tone="success" size="xs">Approved</Badge>
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>1h ago</span>
            </div>
            <p style={{ color: '#fafafa', margin: '0 0 4px 0', fontWeight: 500 }}>
              Application approved
            </p>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
              Application #12340 has been approved
            </p>
          </div>

          {/* Notification Item */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#18181b', 
            borderRadius: '8px',
            borderLeft: '3px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
              <Badge tone="warning" size="xs">Action Required</Badge>
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>3h ago</span>
            </div>
            <p style={{ color: '#fafafa', margin: '0 0 4px 0', fontWeight: 500 }}>
              Document verification needed
            </p>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
              Application #12338 needs additional documents
            </p>
          </div>

          {/* Notification Item */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#18181b', 
            borderRadius: '8px',
            opacity: 0.6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
              <Badge tone="ghost" size="xs">Read</Badge>
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>1d ago</span>
            </div>
            <p style={{ color: '#fafafa', margin: '0 0 4px 0', fontWeight: 500 }}>
              System maintenance scheduled
            </p>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
              Scheduled for Sunday, 2:00 AM - 4:00 AM
            </p>
          </div>

          <Button variant="ghost" size="sm" style={{ marginTop: '8px' }}>
            Mark all as read
          </Button>
        </div>
      </Drawer>

      {/* No Overlay Close Drawer */}
      <Drawer
        open={noOverlayCloseDrawerOpen}
        onClose={() => setNoOverlayCloseDrawerOpen(false)}
        title="No Overlay Close"
        closeOnOverlayClick={false}
      >
        <p style={{ color: '#d4d4d8' }}>
          This drawer cannot be closed by clicking the overlay.
        </p>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
          You must use the close button or press Escape.
        </p>
        <div style={{ marginTop: '24px' }}>
          <Button variant="primary" onClick={() => setNoOverlayCloseDrawerOpen(false)}>
            Close Drawer
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default DrawerDemo;
