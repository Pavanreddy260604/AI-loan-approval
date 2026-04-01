import React from 'react';
import { Form, FormField } from './Form';

/**
 * Form Component Demo
 * 
 * Demonstrates the Form component with various field types and validation.
 */

export const FormDemo: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [submittedData, setSubmittedData] = React.useState<any>(null);

  const loginFields: FormField[] = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'you@example.com',
      required: true,
      hint: 'We\'ll never share your email with anyone else.',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Enter your password',
      required: true,
      validation: (value) => {
        if (value && value.length < 8) {
          return 'Password must be at least 8 characters';
        }
      },
    },
    {
      name: 'remember',
      label: 'Remember me',
      type: 'checkbox',
      defaultValue: false,
    },
  ];

  const registrationFields: FormField[] = [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      placeholder: 'John Doe',
      required: true,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'you@example.com',
      required: true,
    },
    {
      name: 'country',
      label: 'Country',
      type: 'select',
      required: true,
      options: [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
        { value: 'au', label: 'Australia' },
      ],
    },
    {
      name: 'bio',
      label: 'Bio',
      type: 'textarea',
      placeholder: 'Tell us about yourself...',
      hint: 'Maximum 500 characters',
    },
    {
      name: 'terms',
      label: 'I agree to the terms and conditions',
      type: 'checkbox',
      required: true,
    },
  ];

  const handleLoginSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    setFormError('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate error for demo
    if (values.email === 'error@example.com') {
      setFormError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }
    
    setSubmittedData(values);
    setLoading(false);
  };

  const handleRegistrationSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    setFormError('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmittedData(values);
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>Form Component Demo</h1>

      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Login Form</h2>
        <div style={{ 
          padding: '24px', 
          backgroundColor: '#09090b', 
          border: '1px solid #27272a', 
          borderRadius: '12px' 
        }}>
          <Form
            fields={loginFields}
            onSubmit={handleLoginSubmit}
            submitText="Sign In"
            loading={loading}
            error={formError}
          />
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#71717a' }}>
            Tip: Use email "error@example.com" to see error state
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Registration Form</h2>
        <div style={{ 
          padding: '24px', 
          backgroundColor: '#09090b', 
          border: '1px solid #27272a', 
          borderRadius: '12px' 
        }}>
          <Form
            fields={registrationFields}
            onSubmit={handleRegistrationSubmit}
            submitText="Create Account"
            showCancel
            onCancel={() => alert('Cancel clicked')}
            loading={loading}
          />
        </div>
      </div>

      {submittedData && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#064e3b', 
          border: '1px solid #059669', 
          borderRadius: '8px',
          marginTop: '24px'
        }}>
          <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600, color: '#10b981' }}>
            Form Submitted Successfully!
          </h3>
          <pre style={{ fontSize: '12px', color: '#86efac', overflow: 'auto' }}>
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FormDemo;
