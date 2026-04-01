import React from 'react';
import { Radio } from './Radio';

/**
 * Radio Component Demo
 * 
 * Demonstrates various states and configurations of the Radio component.
 */
export const RadioDemo: React.FC = () => {
  const [selected1, setSelected1] = React.useState('option1');
  const [selected2, setSelected2] = React.useState('');

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Basic Radio Group</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Radio 
            label="Option 1"
            name="group1"
            value="option1"
            checked={selected1 === 'option1'}
            onChange={(e) => setSelected1(e.target.value)}
          />
          <Radio 
            label="Option 2"
            name="group1"
            value="option2"
            checked={selected1 === 'option2'}
            onChange={(e) => setSelected1(e.target.value)}
          />
          <Radio 
            label="Option 3"
            name="group1"
            value="option3"
            checked={selected1 === 'option3'}
            onChange={(e) => setSelected1(e.target.value)}
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>With Hint Text</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Radio 
            label="Standard shipping"
            hint="Delivery in 5-7 business days"
            name="shipping"
            value="standard"
            checked={selected2 === 'standard'}
            onChange={(e) => setSelected2(e.target.value)}
          />
          <Radio 
            label="Express shipping"
            hint="Delivery in 2-3 business days"
            name="shipping"
            value="express"
            checked={selected2 === 'express'}
            onChange={(e) => setSelected2(e.target.value)}
          />
          <Radio 
            label="Overnight shipping"
            hint="Next day delivery"
            name="shipping"
            value="overnight"
            checked={selected2 === 'overnight'}
            onChange={(e) => setSelected2(e.target.value)}
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Error State</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Radio 
            label="Option A"
            name="group3"
            value="a"
            error="Please select an option"
          />
          <Radio 
            label="Option B"
            name="group3"
            value="b"
            error="Please select an option"
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Disabled State</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Radio 
            label="Disabled unchecked"
            name="group4"
            value="disabled1"
            disabled
          />
          <Radio 
            label="Disabled checked"
            name="group4"
            value="disabled2"
            checked={true}
            disabled
            readOnly
          />
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Without Label</h2>
        <Radio name="group5" value="no-label" aria-label="Radio without visible label" />
      </section>
    </div>
  );
};

export default RadioDemo;
