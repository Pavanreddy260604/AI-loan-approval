import React, { useState } from 'react';
import { ToastProvider, useToast } from './Toast';
import { Button } from '../atoms/Button';
import { Card } from './Card';

/**
 * Toast Demo Content Component
 * 
 * Demonstrates all toast functionality using the useToast hook.
 */
const ToastDemoContent: React.FC = () => {
  const toast = useToast();
  const [customDuration, setCustomDuration] = useState(5000);

  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>Toast Component Demo</h1>

      {/* Basic Toast Types */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Toast Types</h2>
        <Card>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button 
              variant="primary" 
              onClick={() => toast.success('Operation completed successfully!')}
            >
              Success Toast
            </Button>
            <Button 
              variant="danger" 
              onClick={() => toast.error('An error occurred. Please try again.')}
            >
              Error Toast
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => toast.warning('Warning: This action cannot be undone.')}
            >
              Warning Toast
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => toast.info('Here is some helpful information.')}
            >
              Info Toast
            </Button>
          </div>
        </Card>
      </section>

      {/* Custom Duration */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Custom Duration</h2>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#d4d4d8', display: 'block', marginBottom: '8px' }}>
              Duration: {customDuration}ms
            </label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="1000"
              value={customDuration}
              onChange={(e) => setCustomDuration(Number(e.target.value))}
              style={{ width: '100%', maxWidth: '300px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button 
              variant="primary" 
              onClick={() => toast.success(`This toast will dismiss in ${customDuration}ms`, customDuration)}
            >
              Show Toast ({customDuration}ms)
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => toast.info('Quick toast!', 2000)}
            >
              Quick (2s)
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => toast.info('Long toast...', 10000)}
            >
              Long (10s)
            </Button>
          </div>
        </Card>
      </section>

      {/* Multiple Toasts (Stacking) */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Toast Stacking</h2>
        <Card>
          <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
            Click to trigger multiple toasts at once. They will stack vertically.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button 
              variant="primary" 
              onClick={() => {
                toast.success('First toast');
                setTimeout(() => toast.info('Second toast'), 100);
                setTimeout(() => toast.warning('Third toast'), 200);
                setTimeout(() => toast.error('Fourth toast'), 300);
              }}
            >
              Show 4 Toasts
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                for (let i = 1; i <= 5; i++) {
                  setTimeout(() => toast.info(`Toast #${i}`), i * 100);
                }
              }}
            >
              Show 5 Toasts
            </Button>
          </div>
        </Card>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Real-world Examples</h2>
        
        {/* Form Submission */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Form Submission</h3>
          <Card>
            <p style={{ color: '#d4d4d8', marginBottom: '16px' }}>
              Simulate form submission feedback
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={() => {
                  toast.info('Saving changes...');
                  setTimeout(() => toast.success('Changes saved successfully!'), 1500);
                }}
              >
                Save Form
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  toast.info('Submitting...');
                  setTimeout(() => toast.error('Validation failed. Please check your inputs.'), 1500);
                }}
              >
                Submit with Error
              </Button>
            </div>
          </Card>
        </div>

        {/* File Upload */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>File Upload</h3>
          <Card>
            <p style={{ color: '#d4d4d8', marginBottom: '16px' }}>
              Simulate file upload process
            </p>
            <Button 
              variant="primary" 
              onClick={() => {
                toast.info('Uploading file...');
                setTimeout(() => toast.success('File uploaded successfully!'), 2000);
              }}
            >
              Upload File
            </Button>
          </Card>
        </div>

        {/* Data Operations */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Data Operations</h3>
          <Card>
            <p style={{ color: '#d4d4d8', marginBottom: '16px' }}>
              Simulate various data operations
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={() => toast.success('Record created successfully')}
              >
                Create Record
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => toast.success('Record updated successfully')}
              >
                Update Record
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  toast.warning('Are you sure? This action cannot be undone.');
                  setTimeout(() => toast.success('Record deleted successfully'), 2000);
                }}
              >
                Delete Record
              </Button>
            </div>
          </Card>
        </div>

        {/* Network Operations */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Network Operations</h3>
          <Card>
            <p style={{ color: '#d4d4d8', marginBottom: '16px' }}>
              Simulate network-related notifications
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button 
                variant="secondary" 
                onClick={() => toast.info('Syncing data with server...')}
              >
                Sync Data
              </Button>
              <Button 
                variant="danger" 
                onClick={() => toast.error('Network error. Please check your connection.')}
              >
                Network Error
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => toast.warning('Connection lost. Retrying...')}
              >
                Connection Lost
              </Button>
              <Button 
                variant="primary" 
                onClick={() => toast.success('Connected to server')}
              >
                Connected
              </Button>
            </div>
          </Card>
        </div>

        {/* Loan Application Workflow */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Loan Application Workflow</h3>
          <Card>
            <p style={{ color: '#d4d4d8', marginBottom: '16px' }}>
              Simulate loan application process notifications
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={() => {
                  toast.info('Submitting loan application...');
                  setTimeout(() => toast.success('Application submitted successfully! Reference #12345'), 2000);
                }}
              >
                Submit Application
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => toast.info('Application #12345 is under review')}
              >
                Check Status
              </Button>
              <Button 
                variant="primary" 
                onClick={() => toast.success('Congratulations! Your loan has been approved.')}
              >
                Approve Loan
              </Button>
              <Button 
                variant="danger" 
                onClick={() => toast.error('Application rejected. Please contact support for details.')}
              >
                Reject Loan
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => toast.warning('Additional documents required for application #12345')}
              >
                Request Documents
              </Button>
            </div>
          </Card>
        </div>

        {/* User Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>User Actions</h3>
          <Card>
            <p style={{ color: '#d4d4d8', marginBottom: '16px' }}>
              Common user action feedback
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={() => toast.success('Item added to favorites')}
              >
                Add to Favorites
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => toast.success('Copied to clipboard')}
              >
                Copy to Clipboard
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => toast.success('Settings saved')}
              >
                Save Settings
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => toast.info('Email sent successfully')}
              >
                Send Email
              </Button>
              <Button 
                variant="danger" 
                onClick={() => toast.warning('Session will expire in 5 minutes')}
              >
                Session Warning
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Interactive Demo */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Interactive Demo</h2>
        <Card>
          <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
            Try different combinations and see how toasts behave
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => toast.success('Success!')}
            >
              Success
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => toast.error('Error!')}
            >
              Error
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => toast.warning('Warning!')}
            >
              Warning
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toast.info('Info!')}
            >
              Info
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast.success('Quick!', 1000)}
            >
              Quick (1s)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast.info('Normal', 5000)}
            >
              Normal (5s)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast.warning('Long', 10000)}
            >
              Long (10s)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast.success('Toast 1');
                toast.error('Toast 2');
                toast.warning('Toast 3');
              }}
            >
              3 at Once
            </Button>
          </div>
        </Card>
      </section>

      {/* Usage Instructions */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Usage Instructions</h2>
        <Card>
          <div style={{ color: '#d4d4d8' }}>
            <h3 style={{ color: '#fafafa', marginBottom: '12px' }}>Setup</h3>
            <pre style={{ 
              backgroundColor: '#18181b', 
              padding: '16px', 
              borderRadius: '8px', 
              overflow: 'auto',
              fontSize: '0.875rem',
              marginBottom: '16px'
            }}>
{`import { ToastProvider } from './components/ui/molecules/Toast';

function App() {
  return (
    <ToastProvider position="top" maxToasts={5}>
      <YourApp />
    </ToastProvider>
  );
}`}
            </pre>

            <h3 style={{ color: '#fafafa', marginBottom: '12px' }}>Usage</h3>
            <pre style={{ 
              backgroundColor: '#18181b', 
              padding: '16px', 
              borderRadius: '8px', 
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
{`import { useToast } from './components/ui/molecules/Toast';

function MyComponent() {
  const toast = useToast();
  
  const handleSave = () => {
    toast.success('Changes saved successfully!');
  };
  
  const handleError = () => {
    toast.error('An error occurred');
  };
  
  const handleCustom = () => {
    toast.info('Custom duration', 3000);
  };
  
  return <button onClick={handleSave}>Save</button>;
}`}
            </pre>
          </div>
        </Card>
      </section>
    </div>
  );
};

/**
 * Toast Component Demo
 * 
 * Visual demonstration of all Toast variants and functionality.
 * This file serves as both documentation and manual testing.
 */
export const ToastDemo: React.FC = () => {
  return (
    <ToastProvider position="top" maxToasts={5}>
      <ToastDemoContent />
    </ToastProvider>
  );
};

export default ToastDemo;
