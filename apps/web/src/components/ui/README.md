# Elite v2 Design System

A comprehensive, production-ready design system built on atomic design principles for the AI Loan Intelligence Platform. This system provides a complete library of reusable UI components with consistent APIs, accessibility compliance, and dark mode support.

## Architecture

The design system follows **atomic design principles** with three distinct component tiers:

```
Design Tokens (Foundation)
    ↓
Atomic Components (Tier 1)
    ↓
Molecular Components (Tier 2)
    ↓
Organism Components (Tier 3)
    ↓
Application Pages
```

### Component Tiers

#### Atomic Components (`/atoms`)
Basic, indivisible UI elements that cannot be broken down further. These are the building blocks of the design system.

**Examples:** Button, Input, Badge, Avatar, Spinner, Checkbox, Radio, Switch

#### Molecular Components (`/molecules`)
Composed of multiple atomic components working together to implement common UI patterns.

**Examples:** Card, Modal, Drawer, Dropdown, Tooltip, Toast, Alert

#### Organism Components (`/organisms`)
Complex components combining molecules and atoms to form sophisticated application features.

**Examples:** Table, Form, Navbar, Sidebar, Tabs, Stepper, DataGrid

## Getting Started

### Installation

All components are available through a single barrel export:

```typescript
import { Button, Card, Table } from '@/components/ui';
```

### Design Tokens

Design tokens are centralized variables representing design decisions (colors, spacing, typography) that ensure consistency across the application.

```typescript
import { designTokens } from '@/lib/design-tokens';

// Access tokens
const primaryColor = designTokens.colors.primary.DEFAULT;
const spacing = designTokens.spacing[4]; // 16px
const fontSize = designTokens.typography.fontSizes.base; // 1rem
```

#### Token Categories

- **Colors**: Primary, secondary, neutral, and semantic colors (success, warning, danger, info)
- **Spacing**: 4px base unit with scale values (0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24)
- **Typography**: Font sizes, line heights, and font weights
- **Shadows**: Depth hierarchy (sm, md, lg, xl, 2xl)
- **Border Radius**: Consistent rounding (sm, md, lg, xl, 2xl, full)
- **Transitions**: Animation durations (fast, base, slow)

## Component Usage Examples

### Atomic Components

#### Button

```typescript
import { Button } from '@/components/ui';

// Basic usage
<Button variant="primary" size="md">
  Click Me
</Button>

// With icons and loading state
<Button 
  variant="primary" 
  size="lg"
  loading={isSubmitting}
  leftIcon={<Save />}
>
  Save Changes
</Button>

// Variants: primary, secondary, ghost, danger, outline
// Sizes: xs, sm, md, lg, xl
```

#### Input

```typescript
import { Input } from '@/components/ui';

<Input 
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
  leftIcon={<Mail />}
  hint="We'll never share your email"
/>

// Variants: default, error, success
```

#### Badge

```typescript
import { Badge } from '@/components/ui';

<Badge tone="success" size="sm">Active</Badge>
<Badge tone="warning" size="md">Pending</Badge>
<Badge tone="danger" size="xs">Error</Badge>

// Tones: primary, success, warning, danger, ghost, info
// Sizes: xs, sm, md
```

### Molecular Components

#### Card

```typescript
import { Card, Button } from '@/components/ui';

<Card 
  header={<h3>User Profile</h3>}
  footer={<Button>Save</Button>}
  hoverable
  border
>
  <p>Card content goes here</p>
</Card>
```

#### Modal

```typescript
import { Modal, Button } from '@/components/ui';

<Modal 
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>

// Sizes: sm, md, lg, xl, full
```

#### Toast Notifications

```typescript
import { useToast } from '@/components/ui';

function MyComponent() {
  const toast = useToast();
  
  const handleSuccess = () => {
    toast.success('Changes saved successfully');
  };
  
  const handleError = () => {
    toast.error('Something went wrong', 0); // 0 = no auto-dismiss
  };
  
  return <Button onClick={handleSuccess}>Save</Button>;
}

// Types: success, error, warning, info
```

### Organism Components

#### Table

```typescript
import { Table } from '@/components/ui';

<Table
  data={loans}
  columns={[
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Amount', accessor: 'amount', align: 'right' },
    { 
      header: 'Status', 
      accessor: (row) => <Badge tone="success">{row.status}</Badge> 
    }
  ]}
  pagination
  page={currentPage}
  pageSize={20}
  onPageChange={setCurrentPage}
  selectable
  selectedRows={selectedIds}
  onSelectionChange={setSelectedIds}
/>
```

#### Form

```typescript
import { Form } from '@/components/ui';

<Form
  fields={[
    { 
      name: 'email', 
      label: 'Email', 
      type: 'email', 
      required: true,
      validation: (value) => {
        if (!value.includes('@')) return 'Invalid email';
      }
    },
    { 
      name: 'password', 
      label: 'Password', 
      type: 'password', 
      required: true 
    }
  ]}
  onSubmit={handleLogin}
  submitText="Sign In"
  loading={isLoading}
/>
```

## Design Token Usage Patterns

### Using Tokens in Components

Design tokens are integrated with Tailwind CSS for easy usage:

```typescript
// Using color tokens
<div className="bg-primary text-white border-primary/20">
  Primary colored element
</div>

// Using spacing tokens
<div className="p-4 m-6 gap-3">
  Consistent spacing
</div>

// Using typography tokens
<h1 className="text-4xl font-bold leading-tight">
  Heading with token-based typography
</h1>
```

### Custom Token Usage

For custom styling beyond Tailwind utilities:

```typescript
import { designTokens } from '@/lib/design-tokens';

const customStyles = {
  backgroundColor: designTokens.colors.primary[600],
  padding: designTokens.spacing[4],
  borderRadius: designTokens.borderRadius.lg,
  transition: `all ${designTokens.transitions.base} ease-in-out`
};
```

## Accessibility Features

All components are built with accessibility in mind:

- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **ARIA Attributes**: Proper ARIA labels, roles, and live regions
- **Focus Management**: Focus trapping in modals and drawers
- **Color Contrast**: WCAG 2.1 AA compliant contrast ratios
- **Screen Reader Support**: Semantic HTML and descriptive labels

### Keyboard Shortcuts

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and controls
- **Escape**: Close modals, dropdowns, and drawers
- **Arrow Keys**: Navigate dropdown menus and tabs

## Responsive Design

The design system uses a mobile-first approach with the following breakpoints:

- **sm**: 640px (mobile)
- **md**: 768px (tablet)
- **lg**: 1024px (desktop)
- **xl**: 1280px (large desktop)
- **2xl**: 1536px (extra large)

### Responsive Utilities

```typescript
import { useBreakpoint } from '@/components/ui';

function MyComponent() {
  const breakpoint = useBreakpoint();
  
  return (
    <div>
      {breakpoint === 'sm' && <MobileView />}
      {breakpoint === 'lg' && <DesktopView />}
    </div>
  );
}
```

## Dark Mode

The design system uses dark mode as the default and only theme. All components are optimized for dark backgrounds with proper contrast ratios.

### Color System

- **Primary**: #635BFF (Stripe Indigo)
- **Base**: Zinc scale (50-950)
- **Semantic**: Success (green), Warning (amber), Danger (red), Info (blue)

## Performance Optimization

The design system includes several performance optimizations:

- **Code Splitting**: Heavy components (Form, DataGrid) are lazy-loaded
- **Memoization**: Components use React.memo() to prevent unnecessary re-renders
- **Tree Shaking**: Import only what you need with barrel exports
- **CSS-in-JS**: Zero runtime overhead with Tailwind CSS

## Migration Guide

### Migrating from Legacy Components

If you're migrating from old component implementations:

1. **Update Imports**
   ```typescript
   // Old
   import { Button } from '@/components/ui/button';
   
   // New
   import { Button } from '@/components/ui';
   ```

2. **Update Component APIs**
   ```typescript
   // Old Button
   <Button variant="primary" size="md">Click</Button>
   
   // New Button (same API!)
   <Button variant="primary" size="md">Click</Button>
   ```

3. **Replace Hardcoded Values**
   ```typescript
   // Old
   <div className="bg-[#635BFF] p-[16px]">
   
   // New
   <div className="bg-primary p-4">
   ```

### Common Migration Patterns

#### Card Component

```typescript
// Old
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// New
<Card 
  header={<h3>Title</h3>}
  padded
>
  Content
</Card>
```

#### Form Fields

```typescript
// Old
<Field label="Email" error={errors.email} {...register('email')} />

// New
<Input label="Email" error={errors.email} {...register('email')} />
```

## Component API Consistency

All components follow consistent API patterns:

- **className**: Custom styling on all components
- **variant**: Style variant selection (primary, secondary, etc.)
- **size**: Size options (xs, sm, md, lg, xl)
- **disabled**: Disable interactive components
- **loading**: Loading states for async actions
- **error**: Error states for form components
- **onChange**: Value change handlers
- **children**: Component composition
- **leftIcon/rightIcon**: Icon placement

## Testing

All components include comprehensive test coverage:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui';

test('renders button with text', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});
```

## Contributing

When adding new components:

1. Follow atomic design principles
2. Use design tokens for all styling values
3. Implement consistent prop APIs
4. Include TypeScript types with JSDoc comments
5. Add accessibility features (ARIA, keyboard navigation)
6. Write unit tests
7. Update this documentation

## Support

For questions or issues with the design system:

- Check component demos in `*.demo.tsx` files
- Review component tests in `*.test.tsx` files
- Consult the design document at `.kiro/specs/design-system-transformation/design.md`
