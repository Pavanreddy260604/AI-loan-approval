import React from 'react';
import { Dropdown, DropdownItem } from './Dropdown';
import { Button } from '../atoms/Button';
import { spacing } from '../../../lib/design-tokens';

/**
 * Dropdown Component Demo
 * 
 * Visual testing and documentation for the Dropdown component.
 * Demonstrates all variants, placements, and features.
 */

// Sample icons (using simple emoji for demo purposes)
const EditIcon = () => <span>✏️</span>;
const CopyIcon = () => <span>📋</span>;
const TrashIcon = () => <span>🗑️</span>;
const DownloadIcon = () => <span>⬇️</span>;
const ShareIcon = () => <span>🔗</span>;
const ArchiveIcon = () => <span>📦</span>;

export const DropdownDemo: React.FC = () => {
  const handleSelect = (value: string) => {
    console.log('Selected:', value);
    alert(`Selected: ${value}`);
  };

  // Basic items
  const basicItems: DropdownItem[] = [
    { label: 'Edit', value: 'edit' },
    { label: 'Duplicate', value: 'duplicate' },
    { label: 'Archive', value: 'archive' },
    { label: 'Delete', value: 'delete', danger: true },
  ];

  // Items with icons
  const itemsWithIcons: DropdownItem[] = [
    { label: 'Edit', value: 'edit', icon: <EditIcon /> },
    { label: 'Duplicate', value: 'duplicate', icon: <CopyIcon /> },
    { label: 'Download', value: 'download', icon: <DownloadIcon /> },
    { label: 'Share', value: 'share', icon: <ShareIcon /> },
    { label: 'Archive', value: 'archive', icon: <ArchiveIcon /> },
    { label: 'Delete', value: 'delete', icon: <TrashIcon />, danger: true },
  ];

  // Items with disabled state
  const itemsWithDisabled: DropdownItem[] = [
    { label: 'Edit', value: 'edit', icon: <EditIcon /> },
    { label: 'Duplicate', value: 'duplicate', icon: <CopyIcon />, disabled: true },
    { label: 'Download', value: 'download', icon: <DownloadIcon /> },
    { label: 'Delete', value: 'delete', icon: <TrashIcon />, danger: true },
  ];

  // Simple items for placement demo
  const simpleItems: DropdownItem[] = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
  ];

  const containerStyles: React.CSSProperties = {
    padding: spacing[8],
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const sectionStyles: React.CSSProperties = {
    marginBottom: spacing[12],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: spacing[4],
    color: '#f4f4f5',
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#a1a1aa',
    marginBottom: spacing[6],
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[6],
  };

  const demoItemStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  };

  const labelStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#d4d4d8',
  };

  const placementGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: spacing[8],
    marginTop: spacing[8],
  };

  const placementCellStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    border: '1px dashed #3f3f46',
    borderRadius: '8px',
    padding: spacing[6],
  };

  return (
    <div style={containerStyles}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: spacing[2], color: '#ffffff' }}>
        Dropdown Component
      </h1>
      <p style={{ fontSize: '1rem', color: '#a1a1aa', marginBottom: spacing[8] }}>
        A flexible dropdown menu component with keyboard navigation, placement options, and height expansion animation.
      </p>

      {/* Basic Dropdown */}
      <section style={sectionStyles}>
        <h2 style={titleStyles}>Basic Dropdown</h2>
        <p style={descriptionStyles}>
          Simple dropdown with text-only menu items.
        </p>
        <div style={gridStyles}>
          <div style={demoItemStyles}>
            <span style={labelStyles}>Default</span>
            <Dropdown
              trigger={<Button variant="primary">Actions</Button>}
              items={basicItems}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </section>

      {/* Dropdown with Icons */}
      <section style={sectionStyles}>
        <h2 style={titleStyles}>Dropdown with Icons</h2>
        <p style={descriptionStyles}>
          Menu items with icons for better visual recognition.
        </p>
        <div style={gridStyles}>
          <div style={demoItemStyles}>
            <span style={labelStyles}>With Icons</span>
            <Dropdown
              trigger={<Button variant="secondary">More Actions</Button>}
              items={itemsWithIcons}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </section>

      {/* Dropdown with Disabled Items */}
      <section style={sectionStyles}>
        <h2 style={titleStyles}>Disabled Items</h2>
        <p style={descriptionStyles}>
          Some menu items can be disabled to prevent interaction.
        </p>
        <div style={gridStyles}>
          <div style={demoItemStyles}>
            <span style={labelStyles}>With Disabled Item</span>
            <Dropdown
              trigger={<Button variant="outline">Options</Button>}
              items={itemsWithDisabled}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </section>

      {/* Danger Variant */}
      <section style={sectionStyles}>
        <h2 style={titleStyles}>Danger Variant</h2>
        <p style={descriptionStyles}>
          Destructive actions are highlighted with the danger variant.
        </p>
        <div style={gridStyles}>
          <div style={demoItemStyles}>
            <span style={labelStyles}>With Danger Item</span>
            <Dropdown
              trigger={<Button variant="ghost">Menu</Button>}
              items={itemsWithIcons}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </section>

      {/* Placement Options */}
      <section style={sectionStyles}>
        <h2 style={titleStyles}>Placement Options</h2>
        <p style={descriptionStyles}>
          Dropdown can be positioned in different locations relative to the trigger.
        </p>
        <div style={placementGridStyles}>
          <div style={placementCellStyles}>
            <span style={{ ...labelStyles, marginBottom: spacing[4] }}>Bottom Start</span>
            <Dropdown
              trigger={<Button variant="primary">Bottom Start</Button>}
              items={simpleItems}
              onSelect={handleSelect}
              placement="bottom-start"
            />
          </div>
          <div style={placementCellStyles}>
            <span style={{ ...labelStyles, marginBottom: spacing[4] }}>Bottom End</span>
            <Dropdown
              trigger={<Button variant="primary">Bottom End</Button>}
              items={simpleItems}
              onSelect={handleSelect}
              placement="bottom-end"
            />
          </div>
          <div style={placementCellStyles}>
            <span style={{ ...labelStyles, marginBottom: spacing[4] }}>Top Start</span>
            <Dropdown
              trigger={<Button variant="secondary">Top Start</Button>}
              items={simpleItems}
              onSelect={handleSelect}
              placement="top-start"
            />
          </div>
          <div style={placementCellStyles}>
            <span style={{ ...labelStyles, marginBottom: spacing[4] }}>Top End</span>
            <Dropdown
              trigger={<Button variant="secondary">Top End</Button>}
              items={simpleItems}
              onSelect={handleSelect}
              placement="top-end"
            />
          </div>
        </div>
      </section>

      {/* Keyboard Navigation */}
      <section style={sectionStyles}>
        <h2 style={titleStyles}>Keyboard Navigation</h2>
        <p style={descriptionStyles}>
          Try using keyboard to navigate:
        </p>
        <ul style={{ color: '#a1a1aa', marginBottom: spacing[6], paddingLeft: spacing[6] }}>
          <li>Click the button to open the dropdown</li>
          <li><strong>Arrow Down</strong> - Navigate to next item</li>
          <li><strong>Arrow Up</strong> - Navigate to previous item</li>
          <li><strong>Enter</strong> - Select focused item</li>
          <li><strong>Escape</strong> - Close dropdown</li>
        </ul>
        <div style={gridStyles}>
          <div style={demoItemStyles}>
            <span style={labelStyles}>Try Keyboard Navigation</span>
            <Dropdown
              trigger={<Button variant="primary">Open Menu</Button>}
              items={itemsWithIcons}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </section>

      {/* Different Trigger Types */}
      <section style={sectionStyles}>
        <h2 style={titleStyles}>Different Trigger Types</h2>
        <p style={descriptionStyles}>
          Dropdown can be triggered by any element.
        </p>
        <div style={gridStyles}>
          <div style={demoItemStyles}>
            <span style={labelStyles}>Button Trigger</span>
            <Dropdown
              trigger={<Button variant="primary">Button</Button>}
              items={basicItems}
              onSelect={handleSelect}
            />
          </div>
          <div style={demoItemStyles}>
            <span style={labelStyles}>Text Trigger</span>
            <Dropdown
              trigger={
                <span style={{ 
                  color: '#635BFF', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}>
                  Click me
                </span>
              }
              items={basicItems}
              onSelect={handleSelect}
            />
          </div>
          <div style={demoItemStyles}>
            <span style={labelStyles}>Icon Trigger</span>
            <Dropdown
              trigger={
                <button style={{
                  background: 'transparent',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: '#d4d4d8',
                  fontSize: '1.25rem'
                }}>
                  ⋮
                </button>
              }
              items={basicItems}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </section>

      {/* Long Menu */}
      <section style={sectionStyles}>
        <h2 style={titleStyles}>Long Menu</h2>
        <p style={descriptionStyles}>
          Dropdown handles long lists of items with scrolling.
        </p>
        <div style={gridStyles}>
          <div style={demoItemStyles}>
            <span style={labelStyles}>Many Items</span>
            <Dropdown
              trigger={<Button variant="outline">Select Option</Button>}
              items={Array.from({ length: 15 }, (_, i) => ({
                label: `Option ${i + 1}`,
                value: `option${i + 1}`,
              }))}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default DropdownDemo;
