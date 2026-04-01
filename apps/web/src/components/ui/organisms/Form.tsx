import React from 'react';
import { spacing } from '../../../lib/design-tokens';
import { Input } from '../atoms/Input';
import { Select, SelectOption } from '../atoms/Select';
import { Textarea } from '../atoms/Textarea';
import { Checkbox } from '../atoms/Checkbox';
import { Button } from '../atoms/Button';
import { Alert } from '../molecules/Alert';

/**
 * Form Field Configuration
 * 
 * Defines the structure and validation for a form field.
 */
export interface FormField {
  /** Field name (used as key in form values) */
  name: string;
  
  /** Field label */
  label: string;
  
  /** Field type */
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Required field */
  required?: boolean;
  
  /** Validation function */
  validation?: (value: any) => string | undefined;
  
  /** Options for select fields */
  options?: SelectOption[];
  
  /** Default value */
  defaultValue?: any;
  
  /** Helper text */
  hint?: string;
  
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Form Component Props
 * 
 * Organism form component following the design system specification.
 * Supports validation, field-level errors, form-level error handling, and loading state.
 * 
 * **Validates: Requirements 4.4, 4.5, 8.4, 8.5, 14.7, 14.10**
 */
export interface FormProps {
  /** Form fields configuration */
  fields: FormField[];
  
  /** Submit handler */
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  
  /** Initial values */
  initialValues?: Record<string, any>;
  
  /** Submit button text */
  submitText?: string;
  
  /** Show cancel button */
  showCancel?: boolean;
  
  /** Cancel handler */
  onCancel?: () => void;
  
  /** Loading state */
  loading?: boolean;
  
  /** Form-level error message */
  error?: string;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Form Component
 * 
 * A comprehensive form component with validation support, field-level error display,
 * form-level error handling, and loading state during submission.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Form
 *   fields={[
 *     { name: 'email', label: 'Email', type: 'email', required: true },
 *     { name: 'password', label: 'Password', type: 'password', required: true }
 *   ]}
 *   onSubmit={handleLogin}
 *   submitText="Sign In"
 *   loading={isLoading}
 *   error={formError}
 * />
 * ```
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      fields,
      onSubmit,
      initialValues = {},
      submitText = 'Submit',
      showCancel = false,
      onCancel,
      loading = false,
      error,
      className = '',
    },
    ref
  ) => {
    // Form state
    const [values, setValues] = React.useState<Record<string, any>>(() => {
      const initial: Record<string, any> = {};
      fields.forEach(field => {
        initial[field.name] = initialValues[field.name] ?? field.defaultValue ?? (field.type === 'checkbox' ? false : '');
      });
      return initial;
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [touched, setTouched] = React.useState<Record<string, boolean>>({});

    // Validate single field
    const validateField = (field: FormField, value: any): string | undefined => {
      // Required validation
      if (field.required) {
        if (field.type === 'checkbox' && !value) {
          return `${field.label} is required`;
        }
        if (field.type !== 'checkbox' && (!value || value.toString().trim() === '')) {
          return `${field.label} is required`;
        }
      }

      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
      }

      // Custom validation
      if (field.validation) {
        return field.validation(value);
      }

      return undefined;
    };

    // Validate all fields
    const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};
      
      fields.forEach(field => {
        const error = validateField(field, values[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Handle field change
    const handleChange = (fieldName: string, value: any) => {
      setValues(prev => ({ ...prev, [fieldName]: value }));
      
      // Clear error when user starts typing
      if (errors[fieldName]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    };

    // Handle field blur
    const handleBlur = (fieldName: string) => {
      setTouched(prev => ({ ...prev, [fieldName]: true }));
      
      // Validate on blur
      const field = fields.find(f => f.name === fieldName);
      if (field) {
        const error = validateField(field, values[fieldName]);
        if (error) {
          setErrors(prev => ({ ...prev, [fieldName]: error }));
        }
      }
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      fields.forEach(field => {
        allTouched[field.name] = true;
      });
      setTouched(allTouched);

      // Validate form
      if (!validateForm()) {
        return;
      }

      // Submit form
      await onSubmit(values);
    };

    // Render field based on type
    const renderField = (field: FormField) => {
      const fieldError = touched[field.name] ? errors[field.name] : undefined;
      const fieldValue = values[field.name];

      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'number':
          return (
            <Input
              key={field.name}
              type={field.type}
              label={field.label}
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              error={fieldError}
              hint={field.hint}
              disabled={field.disabled || loading}
              required={field.required}
            />
          );

        case 'select':
          return (
            <Select
              key={field.name}
              label={field.label}
              options={field.options || []}
              value={fieldValue}
              onChange={(value) => handleChange(field.name, value)}
              error={fieldError}
              hint={field.hint}
              disabled={field.disabled || loading}
              placeholder={field.placeholder}
            />
          );

        case 'textarea':
          return (
            <Textarea
              key={field.name}
              label={field.label}
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              error={fieldError}
              hint={field.hint}
              disabled={field.disabled || loading}
              required={field.required}
            />
          );

        case 'checkbox':
          return (
            <Checkbox
              key={field.name}
              label={field.label}
              checked={fieldValue}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              onBlur={() => handleBlur(field.name)}
              error={fieldError}
              hint={field.hint}
              disabled={field.disabled || loading}
            />
          );

        default:
          return null;
      }
    };

    // Form styles
    const formStyles: React.CSSProperties = {
      width: '100%',
    };

    // Fields container styles
    const fieldsContainerStyles: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[4],
    };

    // Actions container styles
    const actionsStyles: React.CSSProperties = {
      display: 'flex',
      gap: spacing[3],
      marginTop: spacing[6],
      justifyContent: 'flex-end',
    };

    return (
      <form
        ref={ref}
        className={className}
        style={formStyles}
        onSubmit={handleSubmit}
        noValidate
      >
        {error && (
          <div style={{ marginBottom: spacing[4] }}>
            <Alert variant="error" closable={false}>
              {error}
            </Alert>
          </div>
        )}

        <div style={fieldsContainerStyles}>
          {fields.map(renderField)}
        </div>

        <div style={actionsStyles}>
          {showCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {submitText}
          </Button>
        </div>
      </form>
    );
  }
);

Form.displayName = 'Form';

export default Form;
