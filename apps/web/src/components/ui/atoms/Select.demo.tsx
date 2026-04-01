import React from 'react';
import { Select, SelectOption } from './Select';

/**
 * Select Component Demo
 * 
 * Demonstrates various configurations of the Select component.
 */

const countries: SelectOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'cn', label: 'China' },
  { value: 'in', label: 'India' },
  { value: 'br', label: 'Brazil' },
];

const priorities: SelectOption[] = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' },
];

export const SelectDemo: React.FC = () => {
  const [country, setCountry] = React.useState('');
  const [priority, setPriority] = React.useState('');
  const [searchableCountry, setSearchableCountry] = React.useState('');

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '32px', fontSize: '2rem', fontWeight: 'bold' }}>
        Select Component Demo
      </h1>

      {/* Basic Select */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Basic Select
        </h2>
        <Select
          label="Country"
          options={countries}
          value={country}
          onChange={setCountry}
          placeholder="Select a country"
        />
      </section>

      {/* Searchable Select */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Searchable Select
        </h2>
        <Select
          label="Country (Searchable)"
          options={countries}
          value={searchableCountry}
          onChange={setSearchableCountry}
          searchable
          placeholder="Search for a country"
          hint="Type to search through options"
        />
      </section>

      {/* Select with Error */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Select with Error
        </h2>
        <Select
          label="Priority"
          options={priorities}
          value={priority}
          onChange={setPriority}
          error="Priority is required"
          placeholder="Select priority level"
        />
      </section>

      {/* Select with Hint */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Select with Hint
        </h2>
        <Select
          label="Priority Level"
          options={priorities}
          placeholder="Choose a priority"
          hint="Select the urgency level for this task"
        />
      </section>

      {/* Disabled Select */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Disabled Select
        </h2>
        <Select
          label="Country (Disabled)"
          options={countries}
          value="us"
          disabled
          placeholder="Select a country"
        />
      </section>

      {/* Small Options List */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Small Options List
        </h2>
        <Select
          label="Priority"
          options={priorities}
          placeholder="Select priority"
        />
      </section>

      {/* Without Label */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Without Label
        </h2>
        <Select
          options={priorities}
          placeholder="Select an option"
        />
      </section>

      {/* Controlled State Demo */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Controlled State
        </h2>
        <div style={{ marginBottom: '16px' }}>
          <Select
            label="Select a Country"
            options={countries}
            value={country}
            onChange={setCountry}
            searchable
            placeholder="Choose your country"
          />
        </div>
        <div style={{ padding: '16px', backgroundColor: '#18181b', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#a1a1aa' }}>
            Selected Value: <strong style={{ color: '#f4f4f5' }}>{country || 'None'}</strong>
          </p>
          {country && (
            <button
              onClick={() => setCountry('')}
              style={{
                marginTop: '8px',
                padding: '4px 12px',
                fontSize: '0.875rem',
                backgroundColor: '#27272a',
                color: '#f4f4f5',
                border: '1px solid #3f3f46',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear Selection
            </button>
          )}
        </div>
      </section>

      {/* Keyboard Navigation Demo */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '600' }}>
          Keyboard Navigation
        </h2>
        <Select
          label="Try Keyboard Navigation"
          options={countries}
          searchable
          placeholder="Use arrow keys, Enter, Escape"
          hint="Focus and use: Enter/Space to open, Arrow keys to navigate, Enter to select, Escape to close"
        />
      </section>
    </div>
  );
};

export default SelectDemo;
