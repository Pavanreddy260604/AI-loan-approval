import React from 'react';
import { colors, spacing, typography, borderRadius } from '../../../lib/design-tokens';
import { Table, TableProps } from './Table';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Dropdown, DropdownItem } from '../molecules/Dropdown';

/**
 * Filter Configuration
 * 
 * Defines a filter for the data grid.
 */
export interface DataGridFilter {
  /** Filter key (column accessor) */
  key: string;
  
  /** Filter label */
  label: string;
  
  /** Filter type */
  type: 'text' | 'select';
  
  /** Options for select filters */
  options?: Array<{ value: string; label: string }>;
}

/**
 * DataGrid Component Props
 * 
 * Organism data grid component following the design system specification.
 * Extends Table component with advanced filtering, column visibility controls,
 * and export functionality.
 * 
 * **Validates: Requirements 4.10, 14.10**
 */
export interface DataGridProps<T = any> extends Omit<TableProps<T>, 'data'> {
  /** Original data (before filtering) */
  data: T[];
  
  /** Available filters */
  filters?: DataGridFilter[];
  
  /** Show column visibility controls */
  showColumnControls?: boolean;
  
  /** Show export button */
  showExport?: boolean;
  
  /** Export handler */
  onExport?: (data: T[], format: 'csv' | 'json') => void;
  
  /** Custom filter function */
  onFilter?: (data: T[], filters: Record<string, any>) => T[];
}

/**
 * DataGrid Component
 * 
 * An advanced data grid component that extends the Table component with
 * filtering capabilities, column visibility controls, and export functionality.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <DataGrid
 *   data={loans}
 *   columns={[
 *     { header: 'Name', accessor: 'name', sortable: true },
 *     { header: 'Amount', accessor: 'amount', align: 'right' },
 *     { header: 'Status', accessor: 'status' }
 *   ]}
 *   filters={[
 *     { key: 'name', label: 'Name', type: 'text' },
 *     { key: 'status', label: 'Status', type: 'select', options: statusOptions }
 *   ]}
 *   showColumnControls
 *   showExport
 *   onExport={handleExport}
 * />
 * ```
 */
export const DataGrid = <T extends Record<string, any>>({
  data,
  columns,
  filters = [],
  showColumnControls = false,
  showExport = false,
  onExport,
  onFilter,
  ...tableProps
}: DataGridProps<T>) => {
  // State
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>({});
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(
    columns.map((col, idx) => col.key || (typeof col.accessor === 'string' ? String(col.accessor) : `col-${idx}`))
  );
  const [showFilters, setShowFilters] = React.useState(false);

  // Apply filters to data
  const filteredData = React.useMemo(() => {
    if (onFilter) {
      return onFilter(data, filterValues);
    }

    // Default filtering logic
    return data.filter(row => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value || value === '') return true;
        
        const rowValue = row[key];
        if (rowValue === undefined || rowValue === null) return false;

        // Text filter
        if (typeof value === 'string') {
          return String(rowValue).toLowerCase().includes(value.toLowerCase());
        }

        // Exact match for select filters
        return String(rowValue) === String(value);
      });
    });
  }, [data, filterValues, onFilter]);

  // Filter visible columns
  const visibleColumnDefs = React.useMemo(() => {
    return columns.filter((col, idx) => {
      const colKey = col.key || (typeof col.accessor === 'string' ? String(col.accessor) : `col-${idx}`);
      return visibleColumns.includes(colKey);
    });
  }, [columns, visibleColumns]);

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilterValues({});
  };

  // Handle column visibility toggle
  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnKey)) {
        // Don't allow hiding all columns
        if (prev.length === 1) return prev;
        return prev.filter(key => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  // Handle export
  const handleExport = (format: 'csv' | 'json') => {
    if (onExport) {
      onExport(filteredData, format);
    } else {
      // Default export logic
      if (format === 'json') {
        const dataStr = JSON.stringify(filteredData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.json';
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Simple CSV export
        const headers = visibleColumnDefs.map(col => col.header).join(',');
        const rows = filteredData.map(row => {
          return visibleColumnDefs.map(col => {
            const value = typeof col.accessor === 'function' ? '' : row[col.accessor];
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',');
        });
        const csv = [headers, ...rows].join('\n');
        const dataBlob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.csv';
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // Toolbar styles
  const toolbarStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
    gap: spacing[3],
    flexWrap: 'wrap',
  };

  // Toolbar section styles
  const toolbarSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  // Filters container styles
  const filtersContainerStyles: React.CSSProperties = {
    display: showFilters ? 'grid' : 'none',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[3],
    marginBottom: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.base[900],
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.base[800]}`,
  };

  // Column visibility dropdown items
  const columnVisibilityItems: DropdownItem[] = columns.map((col, idx) => {
    const colKey = col.key || (typeof col.accessor === 'string' ? String(col.accessor) : `col-${idx}`);
    return {
      label: col.header,
      value: colKey,
      icon: visibleColumns.includes(colKey) ? (
        <span style={{ color: colors.primary[600] }}>✓</span>
      ) : (
        <span style={{ opacity: 0 }}>✓</span>
      ),
    };
  });

  // Export dropdown items
  const exportItems: DropdownItem[] = [
    { label: 'Export as CSV', value: 'csv' },
    { label: 'Export as JSON', value: 'json' },
  ];

  // Filter icon
  const FilterIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 4H14M4 8H12M6 12H10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  // Download icon
  const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 2V10M8 10L11 7M8 10L5 7M2 14H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Columns icon
  const ColumnsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 2H6V14H2V2ZM10 2H14V14H10V2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div>
      {/* Toolbar */}
      {(filters.length > 0 || showColumnControls || showExport) && (
        <div style={toolbarStyles}>
          <div style={toolbarSectionStyles}>
            {filters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            )}
            
            {Object.keys(filterValues).some(key => filterValues[key]) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div style={toolbarSectionStyles}>
            {showColumnControls && (
              <Dropdown
                trigger={
                  <Button variant="outline" size="sm" leftIcon={<ColumnsIcon />}>
                    Columns
                  </Button>
                }
                items={columnVisibilityItems}
                onSelect={handleColumnToggle}
                placement="bottom-end"
              />
            )}

            {showExport && (
              <Dropdown
                trigger={
                  <Button variant="outline" size="sm" leftIcon={<DownloadIcon />}>
                    Export
                  </Button>
                }
                items={exportItems}
                onSelect={(value) => handleExport(value as 'csv' | 'json')}
                placement="bottom-end"
              />
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {filters.length > 0 && (
        <div style={filtersContainerStyles}>
          {filters.map(filter => (
            <div key={filter.key}>
              {filter.type === 'text' ? (
                <Input
                  label={filter.label}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={`Filter by ${filter.label.toLowerCase()}...`}
                />
              ) : filter.type === 'select' && filter.options ? (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: typography.fontSizes.sm,
                    fontWeight: typography.fontWeights.medium,
                    color: colors.base[300],
                    marginBottom: spacing[2],
                  }}>
                    {filter.label}
                  </label>
                  <select
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: `${spacing[2]} ${spacing[3]}`,
                      fontSize: typography.fontSizes.base,
                      backgroundColor: colors.base[950],
                      color: colors.base[100],
                      border: `1px solid ${colors.base[800]}`,
                      borderRadius: borderRadius.md,
                      outline: 'none',
                    }}
                  >
                    <option value="">All</option>
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <Table
        {...tableProps}
        data={filteredData}
        columns={visibleColumnDefs}
      />
    </div>
  );
};

DataGrid.displayName = 'DataGrid';

export default DataGrid;
