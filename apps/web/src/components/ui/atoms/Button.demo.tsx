import React from 'react';
import { Button } from './Button';

/**
 * Button Component Demo
 * 
 * Visual demonstration of all Button variants, sizes, and states.
 * This file serves as both documentation and manual testing.
 */
export const ButtonDemo: React.FC = () => {
  const [loading, setLoading] = React.useState(false);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  // Simple icon components for demo
  const SaveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );

  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  // Async operation handlers
  const handleSuccessOperation = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  const handleFailureOperation = async () => {
    await new Promise((_, reject) => setTimeout(() => reject(new Error('Operation failed')), 1500));
  };

  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>Button Component Demo</h1>

      {/* Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Variants</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Sizes</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
      </section>

      {/* States */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>States</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading={loading} onClick={handleLoadingClick}>
            {loading ? 'Loading...' : 'Click to Load'}
          </Button>
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>With Icons</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button leftIcon={<SaveIcon />}>Save Changes</Button>
          <Button rightIcon={<ArrowIcon />}>Continue</Button>
          <Button leftIcon={<SaveIcon />} rightIcon={<ArrowIcon />}>
            Save and Continue
          </Button>
        </div>
      </section>

      {/* Async Operations */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Async Operations</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button 
            onAsyncClick={handleSuccessOperation}
            successIcon={<CheckIcon />}
            feedbackDuration={2000}
          >
            Success Operation
          </Button>
          <Button 
            variant="danger"
            onAsyncClick={handleFailureOperation}
            errorIcon={<XIcon />}
            feedbackDuration={2000}
          >
            Failure Operation
          </Button>
          <Button 
            variant="secondary"
            onAsyncClick={handleSuccessOperation}
            successIcon={<CheckIcon />}
            leftIcon={<SaveIcon />}
            feedbackDuration={1500}
          >
            Save with Feedback
          </Button>
        </div>
        <p style={{ color: '#71717a', marginTop: '12px', fontSize: '0.875rem' }}>
          Click these buttons to see automatic loading states and success/error feedback
        </p>
      </section>

      {/* Combined Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Combined Examples</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary" size="lg" leftIcon={<SaveIcon />}>
            Save Changes
          </Button>
          <Button variant="danger" size="sm" disabled>
            Delete Account
          </Button>
          <Button variant="outline" size="md" rightIcon={<ArrowIcon />}>
            Learn More
          </Button>
          <Button variant="ghost" size="xs">
            Cancel
          </Button>
        </div>
      </section>

      {/* All Variants with All Sizes */}
      <section>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Complete Matrix</h2>
        {(['primary', 'secondary', 'ghost', 'danger', 'outline'] as const).map((variant) => (
          <div key={variant} style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem', textTransform: 'capitalize' }}>
              {variant}
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {size.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ButtonDemo;
