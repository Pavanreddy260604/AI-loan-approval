/**
 * Contrast Ratio Calculator
 * 
 * Utility to calculate WCAG 2.1 contrast ratios for dark mode verification.
 * 
 * **Validates: Requirement 15.5 - Maintain WCAG 2.1 AA contrast ratios in dark mode**
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format');
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG 2.1 AA standards
 */
export function meetsWCAG_AA(
  contrastRatio: number,
  textSize: 'normal' | 'large' = 'normal'
): boolean {
  const minRatio = textSize === 'large' ? 3 : 4.5;
  return contrastRatio >= minRatio;
}

/**
 * Check if contrast ratio meets WCAG 2.1 AAA standards
 */
export function meetsWCAG_AAA(
  contrastRatio: number,
  textSize: 'normal' | 'large' = 'normal'
): boolean {
  const minRatio = textSize === 'large' ? 4.5 : 7;
  return contrastRatio >= minRatio;
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Get WCAG compliance level
 */
export function getComplianceLevel(
  contrastRatio: number,
  textSize: 'normal' | 'large' = 'normal'
): 'AAA' | 'AA' | 'Fail' {
  if (meetsWCAG_AAA(contrastRatio, textSize)) return 'AAA';
  if (meetsWCAG_AA(contrastRatio, textSize)) return 'AA';
  return 'Fail';
}

/**
 * Dark mode color palette from design tokens
 */
export const darkModeColors = {
  // Primary
  'primary-600': '#635BFF',
  'primary-500': '#8b5cf6',
  'primary-400': '#a78bfa',

  // Base/Neutral
  'base-950': '#09090b',
  'base-900': '#18181b',
  'base-800': '#27272a',
  'base-700': '#3f3f46',
  'base-600': '#52525b',
  'base-500': '#71717a',
  'base-400': '#a1a1aa',
  'base-300': '#d4d4d8',
  'base-200': '#e4e4e7',
  'base-100': '#f4f4f5',
  'base-50': '#fafafa',

  // Semantic
  'success-900': '#064e3b',
  'success-500': '#10b981',
  'success-400': '#4ade80',
  'success-50': '#f0fdf4',

  'warning-900': '#78350f',
  'warning-500': '#f59e0b',
  'warning-400': '#fbbf24',
  'warning-50': '#fffbeb',

  'danger-900': '#7f1d1d',
  'danger-700': '#b91c1c',
  'danger-600': '#dc2626',
  'danger-500': '#ef4444',
  'danger-400': '#f87171',
  'danger-50': '#fef2f2',

  'info-900': '#1e3a8a',
  'info-500': '#3b82f6',
  'info-400': '#60a5fa',
  'info-50': '#eff6ff',

  // White
  white: '#ffffff',
};

/**
 * Component contrast verification results
 */
export interface ContrastCheck {
  component: string;
  variant: string;
  foreground: string;
  background: string;
  ratio: number;
  passes: boolean;
  level: 'AAA' | 'AA' | 'Fail';
}

/**
 * Verify all component contrast ratios
 */
export function verifyAllContrasts(): ContrastCheck[] {
  const checks: ContrastCheck[] = [];

  // Button variants
  checks.push({
    component: 'Button',
    variant: 'primary',
    foreground: darkModeColors.white,
    background: darkModeColors['primary-600'],
    ratio: getContrastRatio(darkModeColors.white, darkModeColors['primary-600']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors.white, darkModeColors['primary-600'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors.white, darkModeColors['primary-600'])
    ),
  });

  checks.push({
    component: 'Button',
    variant: 'secondary',
    foreground: darkModeColors['base-100'],
    background: darkModeColors['base-900'],
    ratio: getContrastRatio(darkModeColors['base-100'], darkModeColors['base-900']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['base-100'], darkModeColors['base-900'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['base-100'], darkModeColors['base-900'])
    ),
  });

  checks.push({
    component: 'Button',
    variant: 'ghost',
    foreground: darkModeColors['base-400'],
    background: darkModeColors['base-950'],
    ratio: getContrastRatio(darkModeColors['base-400'], darkModeColors['base-950']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['base-400'], darkModeColors['base-950'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['base-400'], darkModeColors['base-950'])
    ),
  });

  checks.push({
    component: 'Button',
    variant: 'danger',
    foreground: darkModeColors.white,
    background: darkModeColors['danger-600'],
    ratio: getContrastRatio(darkModeColors.white, darkModeColors['danger-600']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors.white, darkModeColors['danger-600'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors.white, darkModeColors['danger-600'])
    ),
  });

  checks.push({
    component: 'Button',
    variant: 'outline',
    foreground: darkModeColors['base-300'],
    background: darkModeColors['base-950'],
    ratio: getContrastRatio(darkModeColors['base-300'], darkModeColors['base-950']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['base-300'], darkModeColors['base-950'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['base-300'], darkModeColors['base-950'])
    ),
  });

  // Input
  checks.push({
    component: 'Input',
    variant: 'default',
    foreground: darkModeColors['base-100'],
    background: darkModeColors['base-950'],
    ratio: getContrastRatio(darkModeColors['base-100'], darkModeColors['base-950']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['base-100'], darkModeColors['base-950'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['base-100'], darkModeColors['base-950'])
    ),
  });

  // Alert variants
  checks.push({
    component: 'Alert',
    variant: 'success',
    foreground: darkModeColors['success-50'],
    background: darkModeColors['success-900'],
    ratio: getContrastRatio(darkModeColors['success-50'], darkModeColors['success-900']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['success-50'], darkModeColors['success-900'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['success-50'], darkModeColors['success-900'])
    ),
  });

  checks.push({
    component: 'Alert',
    variant: 'warning',
    foreground: darkModeColors['warning-50'],
    background: darkModeColors['warning-900'],
    ratio: getContrastRatio(darkModeColors['warning-50'], darkModeColors['warning-900']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['warning-50'], darkModeColors['warning-900'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['warning-50'], darkModeColors['warning-900'])
    ),
  });

  checks.push({
    component: 'Alert',
    variant: 'error',
    foreground: darkModeColors['danger-50'],
    background: darkModeColors['danger-900'],
    ratio: getContrastRatio(darkModeColors['danger-50'], darkModeColors['danger-900']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['danger-50'], darkModeColors['danger-900'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['danger-50'], darkModeColors['danger-900'])
    ),
  });

  checks.push({
    component: 'Alert',
    variant: 'info',
    foreground: darkModeColors['info-50'],
    background: darkModeColors['info-900'],
    ratio: getContrastRatio(darkModeColors['info-50'], darkModeColors['info-900']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['info-50'], darkModeColors['info-900'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['info-50'], darkModeColors['info-900'])
    ),
  });

  // Card
  checks.push({
    component: 'Card',
    variant: 'default',
    foreground: darkModeColors['base-50'],
    background: darkModeColors['base-950'],
    ratio: getContrastRatio(darkModeColors['base-50'], darkModeColors['base-950']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['base-50'], darkModeColors['base-950'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['base-50'], darkModeColors['base-950'])
    ),
  });

  // Table
  checks.push({
    component: 'Table',
    variant: 'header',
    foreground: darkModeColors['base-400'],
    background: darkModeColors['base-900'],
    ratio: getContrastRatio(darkModeColors['base-400'], darkModeColors['base-900']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['base-400'], darkModeColors['base-900'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['base-400'], darkModeColors['base-900'])
    ),
  });

  checks.push({
    component: 'Table',
    variant: 'body',
    foreground: darkModeColors['base-50'],
    background: darkModeColors['base-950'],
    ratio: getContrastRatio(darkModeColors['base-50'], darkModeColors['base-950']),
    passes: meetsWCAG_AA(
      getContrastRatio(darkModeColors['base-50'], darkModeColors['base-950'])
    ),
    level: getComplianceLevel(
      getContrastRatio(darkModeColors['base-50'], darkModeColors['base-950'])
    ),
  });

  return checks;
}

/**
 * Print contrast verification results
 */
export function printContrastResults(): void {
  const results = verifyAllContrasts();
  
  console.log('\n=== Dark Mode Contrast Ratio Verification ===\n');
  console.log('WCAG 2.1 AA Standard: 4.5:1 for normal text, 3:1 for large text\n');
  
  results.forEach((check) => {
    const status = check.passes ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${check.component} (${check.variant})`);
    console.log(`  Ratio: ${formatContrastRatio(check.ratio)} - Level: ${check.level}`);
    console.log(`  Foreground: ${check.foreground}`);
    console.log(`  Background: ${check.background}\n`);
  });
  
  const allPass = results.every((check) => check.passes);
  console.log(`\nOverall: ${allPass ? '✅ All checks passed' : '❌ Some checks failed'}`);
  console.log(`Total checks: ${results.length}`);
  console.log(`Passed: ${results.filter((c) => c.passes).length}`);
  console.log(`Failed: ${results.filter((c) => !c.passes).length}\n`);
}
