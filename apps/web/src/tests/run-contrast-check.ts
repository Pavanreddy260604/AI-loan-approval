/**
 * Contrast Ratio Check Runner
 * 
 * Run this script to verify all dark mode contrast ratios meet WCAG 2.1 AA standards.
 * 
 * Usage: npx tsx src/tests/run-contrast-check.ts
 */

import { printContrastResults } from './contrast-ratio-calculator';

printContrastResults();
