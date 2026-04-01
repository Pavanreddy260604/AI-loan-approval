import React from 'react';
import { Spinner } from './Spinner';

/**
 * Spinner Component Demo
 * 
 * Demonstrates all variants and use cases of the Spinner component.
 */
export const SpinnerDemo: React.FC = () => {
  return (
    <div style={{ padding: '24px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#f4f4f5', marginBottom: '32px', fontSize: '2rem' }}>
        Spinner Component Demo
      </h1>

      {/* Size Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '16px', fontSize: '1.5rem' }}>
          Size Variants
        </h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner size="xs" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>xs (12px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner size="sm" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>sm (16px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner size="md" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>md (20px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner size="lg" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>lg (24px)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner size="xl" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>xl (32px)</span>
          </div>
        </div>
      </section>

      {/* Color Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '16px', fontSize: '1.5rem' }}>
          Color Variants
        </h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner color="primary" size="lg" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>primary</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner color="success" size="lg" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>success</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner color="warning" size="lg" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>warning</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner color="danger" size="lg" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>danger</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner color="info" size="lg" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>info</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Spinner color="base" size="lg" />
            <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>base</span>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '16px', fontSize: '1.5rem' }}>
          Common Use Cases
        </h2>
        
        {/* Inline with text */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#d4d4d8', marginBottom: '12px', fontSize: '1.125rem' }}>
            Inline with Text
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Spinner size="sm" color="primary" />
            <span style={{ color: '#f4f4f5' }}>Loading data...</span>
          </div>
        </div>

        {/* Button loading state */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#d4d4d8', marginBottom: '12px', fontSize: '1.125rem' }}>
            Button Loading State
          </h3>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#635BFF',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'not-allowed',
              opacity: 0.6,
            }}
            disabled
          >
            <Spinner size="sm" color="base" />
            <span>Processing...</span>
          </button>
        </div>

        {/* Centered loading */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#d4d4d8', marginBottom: '12px', fontSize: '1.125rem' }}>
            Centered Loading
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              backgroundColor: '#18181b',
              borderRadius: '8px',
              border: '1px solid #27272a',
            }}
          >
            <Spinner size="xl" color="primary" />
          </div>
        </div>

        {/* With custom label */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#d4d4d8', marginBottom: '12px', fontSize: '1.125rem' }}>
            With Custom Accessibility Label
          </h3>
          <Spinner size="md" color="success" label="Uploading file, please wait..." />
          <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginTop: '8px' }}>
            (Screen readers will announce: "Uploading file, please wait...")
          </p>
        </div>
      </section>

      {/* Accessibility */}
      <section>
        <h2 style={{ color: '#f4f4f5', marginBottom: '16px', fontSize: '1.5rem' }}>
          Accessibility Features
        </h2>
        <ul style={{ color: '#a1a1aa', lineHeight: 1.75 }}>
          <li>Uses semantic <code>role="status"</code> for screen reader announcements</li>
          <li>Includes <code>aria-label</code> for context-specific loading messages</li>
          <li>Hidden text with <code>sr-only</code> class for screen reader users</li>
          <li>Respects <code>prefers-reduced-motion</code> via Tailwind's animate-spin</li>
        </ul>
      </section>
    </div>
  );
};

export default SpinnerDemo;
