import React from 'react';
import { Checkbox } from './Checkbox';

/**
 * Checkbox Component Demo
 * 
 * Demonstrates various states and configurations of the Checkbox component.
 */
export const CheckboxDemo: React.FC = () => {
  const [checked1, setChecked1] = React.useState(false);
  const [checked2, setChecked2] = React.useState(true);
  const [checked3, setChecked3] = React.useState(false);
  const [indeterminate, setIndeterminate] = React.useState(true);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Basic Checkbox</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Checkbox 
            label="Accept terms and conditions"
            checked={checked1}
            onChange={(e) => setChecked1(e.target.checked)}
          />
          <Checkbox 
            label="Subscribe to newsletter"
            checked={checked2}
            onChange={(e) => setChecked2(e.target.checked)}
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>With Hint Text</h2>
        <Checkbox 
          label="Enable two-factor authentication"
          hint="Adds an extra layer of security to your account"
          checked={checked3}
          onChange={(e) => setChecked3(e.target.checked)}
        />
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Error State</h2>
        <Checkbox 
          label="I agree to the terms"
          error="You must accept the terms to continue"
        />
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Disabled State</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Checkbox 
            label="Disabled unchecked"
            disabled
          />
          <Checkbox 
            label="Disabled checked"
            checked={true}
            disabled
            readOnly
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Indeterminate State</h2>
        <Checkbox 
          label="Select all items"
          hint="Some items are selected"
          indeterminate={indeterminate}
          onChange={(e) => {
            setIndeterminate(false);
            setChecked1(e.target.checked);
          }}
        />
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Without Label</h2>
        <Checkbox aria-label="Checkbox without visible label" />
      </section>
    </div>
  );
};

export default CheckboxDemo;
