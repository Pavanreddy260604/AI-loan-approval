/**
 * Organism Components
 * 
 * Barrel export for all organism components.
 * Organism components are complex components composed of molecules and atoms.
 * 
 * Performance: Form and DataGrid use lazy loading to reduce initial bundle size (Req 13.1, 13.5)
 * Table is not lazy-loaded to preserve generic type information
 */

import { lazy } from 'react';

// Table exported directly to preserve generic types
export { Table } from './Table';
export type { TableProps, TableColumn } from './Table';

// Lazy-loaded heavy components for code splitting
export const Form = lazy(() => import('./Form').then(m => ({ default: m.Form })));
export const DataGrid = lazy(() => import('./DataGrid').then(m => ({ default: m.DataGrid })));

// Type exports (not lazy-loaded)
export type { FormProps, FormField } from './Form';
export type { DataGridProps, DataGridFilter } from './DataGrid';

// Lightweight components (no lazy loading needed)
export { Navbar } from './Navbar';
export type { NavbarProps, NavLink, UserMenuItem } from './Navbar';

export { Sidebar } from './Sidebar';
export type { SidebarProps, SidebarItem } from './Sidebar';

export { Tabs } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

export { Stepper } from './Stepper';
export type { StepperProps, StepItem } from './Stepper';
