import React from 'react';
import { Switch } from './Switch';

/**
 * Switch Component Demo
 * 
 * Demonstrates various states and configurations of the Switch component.
 */
export const SwitchDemo: React.FC = () => {
  const [enabled1, setEnabled1] = React.useState(false);
  const [enabled2, setEnabled2] = React.useState(true);
  const [enabled3, setEnabled3] = React.useState(false);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Basic Switch</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Switch 
            label="Enable notifications"
            checked={enabled1}
            onChange={(e) => setEnabled1(e.target.checked)}
          />
          <Switch 
            label="Auto-save changes"
            checked={enabled2}
            onChange={(e) => setEnabled2(e.target.checked)}
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>With Hint Text</h2>
        <Switch 
          label="Enable two-factor authentication"
          hint="Adds an extra layer of security to your account"
          checked={enabled3}
          onChange={(e) => setEnabled3(e.target.checked)}
        />
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Error State</h2>
        <Switch 
          label="Enable feature"
          error="This feature is not available in your plan"
        />
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Disabled State</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Switch 
            label="Disabled off"
            disabled
          />
          <Switch 
            label="Disabled on"
            checked={true}
            disabled
            readOnly
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Size Variants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Switch 
            label="Small switch"
            size="sm"
            checked={enabled1}
            onChange={(e) => setEnabled1(e.target.checked)}
          />
          <Switch 
            label="Medium switch (default)"
            size="md"
            checked={enabled2}
            onChange={(e) => setEnabled2(e.target.checked)}
          />
          <Switch 
            label="Large switch"
            size="lg"
            checked={enabled3}
            onChange={(e) => setEnabled3(e.target.checked)}
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Without Label</h2>
        <Switch aria-label="Switch without visible label" />
      </section>
    </div>
  );
};

export default SwitchDemo;
