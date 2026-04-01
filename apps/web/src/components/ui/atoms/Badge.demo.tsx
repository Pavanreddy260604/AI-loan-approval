import React from 'react';
import { Badge } from './Badge';

/**
 * Badge Component Demo
 * 
 * Visual demonstration of all Badge tone variants and sizes.
 * This file serves as both documentation and manual testing.
 */
export const BadgeDemo: React.FC = () => {
  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>Badge Component Demo</h1>

      {/* Tone Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Tone Variants</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone="primary">Primary</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="ghost">Ghost</Badge>
          <Badge tone="info">Info</Badge>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Sizes</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge size="xs">Extra Small</Badge>
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
        </div>
      </section>

      {/* Status Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Status Examples</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone="success">Active</Badge>
          <Badge tone="warning">Pending</Badge>
          <Badge tone="danger">Rejected</Badge>
          <Badge tone="info">In Review</Badge>
          <Badge tone="ghost">Draft</Badge>
        </div>
      </section>

      {/* Loan Status Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Loan Status Examples</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone="success" size="sm">Approved</Badge>
          <Badge tone="danger" size="sm">Denied</Badge>
          <Badge tone="warning" size="sm">Under Review</Badge>
          <Badge tone="info" size="sm">Submitted</Badge>
          <Badge tone="ghost" size="sm">Incomplete</Badge>
        </div>
      </section>

      {/* Numeric Badges */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Numeric Badges</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone="primary" size="xs">1</Badge>
          <Badge tone="primary" size="xs">5</Badge>
          <Badge tone="primary" size="xs">99+</Badge>
          <Badge tone="danger" size="xs">3</Badge>
          <Badge tone="success" size="xs">42</Badge>
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>With Icons</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone="success">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Verified
            </span>
          </Badge>
          <Badge tone="warning">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Alert
            </span>
          </Badge>
          <Badge tone="danger">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Error
            </span>
          </Badge>
        </div>
      </section>

      {/* Complete Matrix */}
      <section>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Complete Matrix</h2>
        {(['primary', 'success', 'warning', 'danger', 'ghost', 'info'] as const).map((tone) => (
          <div key={tone} style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem', textTransform: 'capitalize' }}>
              {tone}
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {(['xs', 'sm', 'md'] as const).map((size) => (
                <Badge key={size} tone={tone} size={size}>
                  {size.toUpperCase()} {tone}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Real-world Usage Examples */}
      <section style={{ marginTop: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Real-world Usage</h2>
        
        {/* User Profile Example */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#18181b', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ color: '#fafafa', fontSize: '1rem', fontWeight: 500 }}>John Doe</span>
            <Badge tone="success" size="xs">Verified</Badge>
            <Badge tone="primary" size="xs">Premium</Badge>
          </div>
          <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Senior Loan Officer</p>
        </div>

        {/* Loan Application Example */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#18181b', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#fafafa', fontSize: '1rem', fontWeight: 500 }}>Loan Application #12345</span>
            <Badge tone="warning" size="sm">Under Review</Badge>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <Badge tone="ghost" size="xs">Personal Loan</Badge>
            <Badge tone="ghost" size="xs">$50,000</Badge>
            <Badge tone="info" size="xs">High Priority</Badge>
          </div>
        </div>

        {/* Dataset Example */}
        <div style={{ padding: '16px', backgroundColor: '#18181b', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#fafafa', fontSize: '1rem', fontWeight: 500 }}>Training Dataset v2.1</span>
            <Badge tone="success" size="sm">Active</Badge>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <Badge tone="ghost" size="xs">10,000 records</Badge>
            <Badge tone="ghost" size="xs">Updated 2 days ago</Badge>
            <Badge tone="primary" size="xs">Production</Badge>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BadgeDemo;
