import React from 'react';
import { Textarea } from './Textarea';

/**
 * Textarea Component Demo
 * 
 * Demonstrates all variants and features of the Textarea component.
 */
export const TextareaDemo: React.FC = () => {
  const [value1, setValue1] = React.useState('');
  const [value2, setValue2] = React.useState('');
  const [value3, setValue3] = React.useState('This is a success state textarea with some initial content.');
  const [value4, setValue4] = React.useState('');
  const [value5, setValue5] = React.useState('');

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px', fontSize: '2rem', fontWeight: 'bold' }}>
        Textarea Component Demo
      </h1>

      {/* Basic Textarea */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Basic Textarea
        </h2>
        <Textarea
          placeholder="Enter your text here..."
          value={value1}
          onChange={(e) => setValue1(e.target.value)}
        />
      </section>

      {/* With Label */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          With Label
        </h2>
        <Textarea
          label="Description"
          placeholder="Enter a detailed description..."
          value={value2}
          onChange={(e) => setValue2(e.target.value)}
        />
      </section>

      {/* Success Variant */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Success Variant
        </h2>
        <Textarea
          variant="success"
          label="Bio"
          hint="Your bio looks great!"
          placeholder="Enter your bio..."
          value={value3}
          onChange={(e) => setValue3(e.target.value)}
        />
      </section>

      {/* Error State */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Error State
        </h2>
        <Textarea
          label="Comments"
          error="This field is required"
          placeholder="Enter your comments..."
          value={value4}
          onChange={(e) => setValue4(e.target.value)}
        />
      </section>

      {/* With Character Count */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          With Character Count
        </h2>
        <Textarea
          label="Tweet"
          hint="Share your thoughts"
          showCharacterCount
          maxLength={280}
          placeholder="What's happening?"
          value={value5}
          onChange={(e) => setValue5(e.target.value)}
        />
      </section>

      {/* Auto-resize */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Auto-resize
        </h2>
        <Textarea
          label="Notes"
          autoResize
          showCharacterCount
          hint="This textarea will grow as you type"
          placeholder="Start typing to see auto-resize in action..."
        />
      </section>

      {/* Disabled State */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Disabled State
        </h2>
        <Textarea
          label="Disabled Field"
          disabled
          value="This field is disabled and cannot be edited"
          hint="This field is read-only"
        />
      </section>

      {/* All Features Combined */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          All Features Combined
        </h2>
        <Textarea
          label="Product Review"
          autoResize
          showCharacterCount
          maxLength={500}
          hint="Share your experience with this product"
          placeholder="Write your review here..."
        />
      </section>

      {/* Variants Comparison */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Variants Comparison
        </h2>
        <div style={{ display: 'grid', gap: '24px' }}>
          <Textarea
            label="Default Variant"
            placeholder="Default textarea"
          />
          <Textarea
            variant="success"
            label="Success Variant"
            placeholder="Success textarea"
          />
          <Textarea
            variant="error"
            label="Error Variant"
            placeholder="Error textarea"
          />
        </div>
      </section>
    </div>
  );
};

export default TextareaDemo;
