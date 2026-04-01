import React from 'react';
import { Input } from './Input';

/**
 * Input Component Demo
 * 
 * Visual demonstration of all Input variants, states, and features.
 * This file serves as both documentation and manual testing.
 */
export const InputDemo: React.FC = () => {
  const [value, setValue] = React.useState('');
  const [emailValue, setEmailValue] = React.useState('');
  const [passwordValue, setPasswordValue] = React.useState('');

  // Simple icon components for demo
  const MailIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );

  const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const AlertIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );

  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>Input Component Demo</h1>

      {/* Basic Variants */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Variants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            variant="default" 
            placeholder="Default variant" 
          />
          <Input 
            variant="error" 
            placeholder="Error variant" 
          />
          <Input 
            variant="success" 
            placeholder="Success variant" 
          />
        </div>
      </section>

      {/* With Labels */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>With Labels</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Email Address" 
            placeholder="you@example.com" 
          />
          <Input 
            label="Username" 
            placeholder="Enter your username" 
          />
          <Input 
            label="Password" 
            type="password"
            placeholder="Enter your password" 
          />
        </div>
      </section>

      {/* With Error Messages */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>With Error Messages</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Email Address" 
            error="This field is required" 
            placeholder="you@example.com" 
          />
          <Input 
            label="Password" 
            type="password"
            error="Password must be at least 8 characters" 
            placeholder="Enter password" 
          />
          <Input 
            label="Username" 
            error="Username is already taken" 
            placeholder="Choose a username" 
          />
        </div>
      </section>

      {/* With Hint Text */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>With Hint Text</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Email Address" 
            hint="We'll never share your email with anyone else" 
            placeholder="you@example.com" 
          />
          <Input 
            label="Password" 
            type="password"
            hint="Must be at least 8 characters with a number and special character" 
            placeholder="Enter password" 
          />
          <Input 
            label="Phone Number" 
            hint="Format: (123) 456-7890" 
            placeholder="(123) 456-7890" 
          />
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>With Icons</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Email Address" 
            leftIcon={<MailIcon />}
            placeholder="you@example.com" 
          />
          <Input 
            label="Password" 
            type="password"
            leftIcon={<LockIcon />}
            placeholder="Enter password" 
          />
          <Input 
            label="Search" 
            leftIcon={<SearchIcon />}
            placeholder="Search..." 
          />
          <Input 
            label="Verified Email" 
            variant="success"
            rightIcon={<CheckIcon />}
            placeholder="verified@example.com" 
            value="verified@example.com"
            readOnly
          />
        </div>
      </section>

      {/* States */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>States</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Default State" 
            placeholder="Type something..." 
          />
          <Input 
            label="Disabled State" 
            disabled
            placeholder="Cannot type here" 
          />
          <Input 
            label="Read Only" 
            readOnly
            value="This is read-only text"
          />
          <Input 
            label="With Value" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type to see value update" 
          />
        </div>
      </section>

      {/* Complete Form Example */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Complete Form Example</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Email Address" 
            type="email"
            leftIcon={<MailIcon />}
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            error={emailValue && !emailValue.includes('@') ? 'Please enter a valid email' : undefined}
            hint={!emailValue ? 'Enter your email address' : undefined}
            placeholder="you@example.com" 
          />
          <Input 
            label="Password" 
            type="password"
            leftIcon={<LockIcon />}
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            error={passwordValue && passwordValue.length < 8 ? 'Password must be at least 8 characters' : undefined}
            hint={!passwordValue ? 'Must be at least 8 characters' : undefined}
            placeholder="Enter password" 
          />
          <Input 
            label="Confirm Password" 
            type="password"
            leftIcon={<LockIcon />}
            placeholder="Confirm password" 
          />
        </div>
      </section>

      {/* Combined Examples */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Combined Examples</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Search Products" 
            leftIcon={<SearchIcon />}
            hint="Search by name, SKU, or category"
            placeholder="Search..." 
          />
          <Input 
            label="Email Verification" 
            variant="success"
            leftIcon={<MailIcon />}
            rightIcon={<CheckIcon />}
            hint="Email verified successfully"
            value="verified@example.com"
            readOnly
          />
          <Input 
            label="Invalid Input" 
            leftIcon={<AlertIcon />}
            error="This field contains invalid characters"
            placeholder="Enter valid data" 
          />
          <Input 
            label="Disabled with Icon" 
            leftIcon={<LockIcon />}
            disabled
            hint="This field is currently locked"
            placeholder="Locked field" 
          />
        </div>
      </section>

      {/* Different Input Types */}
      <section style={{ marginBottom: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Different Input Types</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Text Input" 
            type="text"
            placeholder="Enter text" 
          />
          <Input 
            label="Email Input" 
            type="email"
            placeholder="Enter email" 
          />
          <Input 
            label="Password Input" 
            type="password"
            placeholder="Enter password" 
          />
          <Input 
            label="Number Input" 
            type="number"
            placeholder="Enter number" 
          />
          <Input 
            label="Date Input" 
            type="date"
          />
          <Input 
            label="URL Input" 
            type="url"
            placeholder="https://example.com" 
          />
          <Input 
            label="Tel Input" 
            type="tel"
            placeholder="(123) 456-7890" 
          />
        </div>
      </section>
    </div>
  );
};

export default InputDemo;
