import React, { useState } from 'react';
import { Alert } from './Alert';
import { Button } from '../atoms/Button';
import { Card } from './Card';

/**
 * Alert Component Demo
 * 
 * Visual demonstration of all Alert variants and functionality.
 * This file serves as both documentation and manual testing.
 */
export const AlertDemo: React.FC = () => {
  const [showDismissable, setShowDismissable] = useState(true);
  const [showCustomClose, setShowCustomClose] = useState(true);

  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>Alert Component Demo</h1>

      {/* Basic Alert Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Alert Variants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert variant="success">
            Operation completed successfully!
          </Alert>
          
          <Alert variant="warning">
            Warning: This action may have unintended consequences.
          </Alert>
          
          <Alert variant="error">
            An error occurred while processing your request.
          </Alert>
          
          <Alert variant="info">
            Here is some helpful information about this feature.
          </Alert>
        </div>
      </section>

      {/* Alerts with Titles */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Alerts with Titles</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert variant="success" title="Success">
            Your changes have been saved successfully.
          </Alert>
          
          <Alert variant="warning" title="Warning">
            Please review the following items before proceeding.
          </Alert>
          
          <Alert variant="error" title="Error">
            Failed to save changes. Please try again.
          </Alert>
          
          <Alert variant="info" title="Information">
            This feature is currently in beta. Some functionality may be limited.
          </Alert>
        </div>
      </section>

      {/* Closable Alerts */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Closable Alerts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert variant="success" closable>
            This alert can be dismissed by clicking the close button.
          </Alert>
          
          <Alert variant="warning" title="Dismissable Warning" closable>
            You can close this warning once you've read it.
          </Alert>
          
          {showDismissable && (
            <Alert 
              variant="info" 
              title="Controlled Dismissal" 
              closable 
              onClose={() => setShowDismissable(false)}
            >
              This alert is controlled by React state. Click the close button to hide it.
            </Alert>
          )}
          
          {!showDismissable && (
            <Button onClick={() => setShowDismissable(true)}>
              Show Dismissable Alert Again
            </Button>
          )}
        </div>
      </section>

      {/* Complex Content */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Complex Content</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert variant="error" title="Validation Errors" closable>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Email address is required</li>
              <li>Password must be at least 8 characters</li>
              <li>Terms and conditions must be accepted</li>
            </ul>
          </Alert>
          
          <Alert variant="success" title="Loan Application Approved">
            <div>
              <p style={{ marginBottom: '8px' }}>
                Congratulations! Your loan application has been approved.
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Loan Amount:</strong> $50,000
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Interest Rate:</strong> 4.5% APR
              </p>
              <p>
                <strong>Reference Number:</strong> LA-2024-12345
              </p>
            </div>
          </Alert>
          
          <Alert variant="warning" title="Action Required">
            <div>
              <p style={{ marginBottom: '8px' }}>
                Additional documents are required to complete your application:
              </p>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Proof of income (last 2 pay stubs)</li>
                <li>Bank statements (last 3 months)</li>
                <li>Government-issued ID</li>
              </ul>
              <p style={{ marginTop: '8px' }}>
                Please upload these documents within 7 days to avoid delays.
              </p>
            </div>
          </Alert>
        </div>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Real-world Examples</h2>
        
        {/* Form Validation */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Form Validation</h3>
          <Card>
            <Alert variant="error" title="Form Validation Failed">
              Please correct the following errors before submitting:
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Email address is invalid</li>
                <li>Phone number must be 10 digits</li>
              </ul>
            </Alert>
          </Card>
        </div>

        {/* Success Message */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Success Message</h3>
          <Card>
            <Alert variant="success" title="Changes Saved" closable>
              Your profile has been updated successfully.
            </Alert>
          </Card>
        </div>

        {/* System Warning */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>System Warning</h3>
          <Card>
            <Alert variant="warning" title="Scheduled Maintenance">
              The system will be undergoing maintenance on Saturday, March 15th from 2:00 AM to 6:00 AM EST. 
              Some features may be unavailable during this time.
            </Alert>
          </Card>
        </div>

        {/* Information Notice */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Information Notice</h3>
          <Card>
            <Alert variant="info" title="New Feature Available" closable>
              We've added a new dashboard widget that shows your loan performance metrics. 
              Check it out in the Dashboard section!
            </Alert>
          </Card>
        </div>

        {/* Loan Application Status */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Loan Application Status</h3>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Alert variant="info" title="Application Received">
                Your loan application (ID: LA-2024-12345) has been received and is being reviewed.
              </Alert>
              
              <Alert variant="warning" title="Documents Required">
                Please upload the requested documents to continue processing your application.
              </Alert>
              
              <Alert variant="success" title="Application Approved" closable>
                Congratulations! Your loan application has been approved. 
                You will receive the funds within 3-5 business days.
              </Alert>
              
              <Alert variant="error" title="Application Rejected">
                Unfortunately, we are unable to approve your loan application at this time. 
                Please contact our support team for more information.
              </Alert>
            </div>
          </Card>
        </div>

        {/* Payment Alerts */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Payment Alerts</h3>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Alert variant="success" title="Payment Received">
                Your payment of $1,250.00 has been successfully processed.
              </Alert>
              
              <Alert variant="warning" title="Payment Due Soon">
                Your next payment of $1,250.00 is due in 5 days (March 20, 2024).
              </Alert>
              
              <Alert variant="error" title="Payment Overdue">
                Your payment of $1,250.00 is overdue. Please make a payment to avoid late fees.
              </Alert>
            </div>
          </Card>
        </div>

        {/* Security Alerts */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Security Alerts</h3>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Alert variant="warning" title="New Login Detected" closable>
                A new login was detected from Chrome on Windows in New York, NY. 
                If this wasn't you, please change your password immediately.
              </Alert>
              
              <Alert variant="info" title="Password Expiring Soon">
                Your password will expire in 7 days. Please update your password to maintain account security.
              </Alert>
              
              <Alert variant="error" title="Suspicious Activity Detected">
                We've detected unusual activity on your account. Your account has been temporarily locked. 
                Please contact support to verify your identity.
              </Alert>
            </div>
          </Card>
        </div>
      </section>

      {/* Interactive Demo */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Interactive Demo</h2>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            {showCustomClose && (
              <Alert 
                variant="warning" 
                title="Custom Close Handler" 
                closable 
                onClose={() => {
                  console.log('Alert closed!');
                  setShowCustomClose(false);
                }}
              >
                This alert has a custom close handler that logs to the console.
              </Alert>
            )}
          </div>
          
          {!showCustomClose && (
            <Button onClick={() => setShowCustomClose(true)}>
              Show Alert with Custom Close Handler
            </Button>
          )}
        </Card>
      </section>

      {/* Usage Instructions */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Usage Instructions</h2>
        <Card>
          <div style={{ color: '#d4d4d8' }}>
            <h3 style={{ color: '#fafafa', marginBottom: '12px' }}>Basic Usage</h3>
            <pre style={{ 
              backgroundColor: '#18181b', 
              padding: '16px', 
              borderRadius: '8px', 
              overflow: 'auto',
              fontSize: '0.875rem',
              marginBottom: '16px'
            }}>
{`import { Alert } from './components/ui/molecules/Alert';

// Simple alert
<Alert variant="success">
  Operation completed successfully!
</Alert>

// Alert with title
<Alert variant="error" title="Error">
  Something went wrong.
</Alert>

// Closable alert
<Alert variant="warning" closable>
  This can be dismissed.
</Alert>

// Alert with custom close handler
<Alert 
  variant="info" 
  closable 
  onClose={() => console.log('Closed')}
>
  Custom close behavior
</Alert>`}
            </pre>

            <h3 style={{ color: '#fafafa', marginBottom: '12px' }}>Props</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>variant</strong>: 'success' | 'warning' | 'error' | 'info' (default: 'info')</li>
              <li><strong>title</strong>: Optional title text</li>
              <li><strong>closable</strong>: Show close button (default: false)</li>
              <li><strong>onClose</strong>: Callback when alert is closed</li>
              <li><strong>className</strong>: Additional CSS classes</li>
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default AlertDemo;
