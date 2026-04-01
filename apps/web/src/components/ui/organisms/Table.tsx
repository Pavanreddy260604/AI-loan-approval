import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, spacing, typography, borderRadius, transitions, shadows } from '../../../lib/design-tokens';
import { Checkbox } from '../atoms/Checkbox';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { EmptyState } from '../molecules/EmptyState';

/**
 * Table Column Definition
 */
export interface TableColumn<T = any> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  key?: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

/**
 * Table Component Props
 * Elite v2 Standardized Props
 */
export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  rowId?: keyof T | ((row: T) => string);
  
  /** 
   * Unified Pagination Configuration
   */
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems?: number;
    onPageChange: (page: number) => void;
  };
  
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
}

/**
 * Table Component (Elite v2)
 */
export const Table = <T extends Record<string, any>>({
  data,
  columns,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowId = 'id',
  pagination,
  sortBy,
  sortDirection = 'asc',
  onSortChange,
  loading = false,
  emptyMessage = 'No data available',
  emptyDescription = 'There are no items to display.',
  onRowClick,
  className = '',
}: TableProps<T>) => {
  
  // Get row ID - memoized for performance
  const getRowId = useCallback((row: T, index: number): string => {
    let idValue: any;
    if (typeof rowId === 'function') {
      idValue = rowId(row);
    } else {
      idValue = row[rowId];
    }
    
    // Fallback if ID is missing or invalid
    if (idValue === undefined || idValue === null || String(idValue) === 'undefined') {
      return `row-${index}`;
    }
    
    return String(idValue);
  }, [rowId]);

  // Check selection states
  const { allSelected, someSelected } = useMemo(() => {
    if (data.length === 0) return { allSelected: false, someSelected: false };
    const all = data.every((row, idx) => selectedRows.includes(getRowId(row, idx)));
    const some = data.some((row, idx) => selectedRows.includes(getRowId(row, idx))) && !all;
    return { allSelected: all, someSelected: some };
  }, [data, selectedRows, getRowId]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map((row, idx) => getRowId(row, idx)));
    }
  }, [allSelected, data, getRowId, onSelectionChange]);

  // Handle row selection
  const handleRowSelect = useCallback((rowIdValue: string) => {
    if (selectedRows.includes(rowIdValue)) {
      onSelectionChange?.(selectedRows.filter(id => id !== rowIdValue));
    } else {
      onSelectionChange?.([...selectedRows, rowIdValue]);
    }
  }, [selectedRows, onSelectionChange]);

  // Handle sort logic
  const handleSort = useCallback((column: TableColumn<T>) => {
    if (!column.sortable) return;
    const columnKey = column.key || (typeof column.accessor === 'string' ? column.accessor : '');
    if (!columnKey) return;
    const newDirection = sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange?.(columnKey as string, newDirection);
  }, [sortBy, sortDirection, onSortChange]);

  // Render cell content
  const renderCell = useCallback((row: T, column: TableColumn<T>, index: number) => {
    if (column.render) return column.render(row, index);
    if (typeof column.accessor === 'function') return column.accessor(row);
    return row[column.accessor as string];
  }, []);

  // Elite v2 Aesthetics
  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    backgroundColor: 'rgba(0, 2, 18, 0.4)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${colors.base[800]}`,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.xl,
    position: 'relative' as const,
    zIndex: 1,
  };

  const headerCellStyles: React.CSSProperties = {
    padding: `${spacing[4]} ${spacing[6]}`,
    textAlign: 'left',
    fontSize: '9px',
    fontWeight: typography.fontWeights.black,
    color: colors.base[500],
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderBottom: `2px solid ${colors.base[800]}`,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    whiteSpace: 'nowrap',
    transition: `all ${transitions.base}`,
  };

  const bodyCellStyles: React.CSSProperties = {
    padding: `${spacing[4]} ${spacing[6]}`,
    fontSize: typography.fontSizes.sm,
    color: colors.base[100],
    borderBottom: `1px solid ${colors.base[800]}50`,
    transition: `all ${transitions.base}`,
  };

  if (!loading && data.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={className}>
        <EmptyState title={emptyMessage} description={emptyDescription} />
      </motion.div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <Spinner size="lg" color="primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-base-500 animate-pulse">Syncing Engine...</span>
          </motion.div>
        ) : (
          <motion.div 
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="w-full overflow-x-auto scrollbar-hide">
              <table style={tableStyles}>
                <thead>
                  <tr>
                    {selectable && (
                      <th style={{ ...headerCellStyles, width: '48px' }}>
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    {columns.map((column, idx) => {
                      const columnKey = column.key || (typeof column.accessor === 'string' ? String(column.accessor) : `col-${idx}`);
                      const isSorted = sortBy === columnKey;
                      
                      return (
                        <th
                          key={columnKey}
                          style={{
                            ...headerCellStyles,
                            textAlign: column.align || 'left',
                            width: column.width,
                            cursor: column.sortable ? 'pointer' : 'default',
                          }}
                          className={column.sortable ? "hover:text-primary transition-colors" : ""}
                          onClick={() => handleSort(column)}
                        >
                          <div className="flex items-center gap-2">
                            <span>{column.header}</span>
                            {column.sortable && (
                              <span className={`text-[10px] ${isSorted ? 'text-primary' : 'text-base-700'}`}>
                                {isSorted && sortDirection === 'asc' ? '↑' : isSorted && sortDirection === 'desc' ? '↓' : '↕'}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-800/20">
                  {data.map((row, rowIndex) => {
                    const rowIdValue = getRowId(row, rowIndex);
                    const isSelected = selectedRows.includes(rowIdValue);
                    
                    return (
                      <motion.tr
                        key={rowIdValue}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: rowIndex * 0.03 }}
                        onClick={() => onRowClick?.(row, rowIndex)}
                        className={`
                          group transition-all duration-300
                          ${onRowClick ? 'cursor-pointer' : ''}
                          ${isSelected ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}
                        `}
                      >
                        {selectable && (
                          <td style={bodyCellStyles}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleRowSelect(rowIdValue)}
                            />
                          </td>
                        )}
                        {columns.map((column, colIdx) => (
                          <td
                            key={`${rowIdValue}-${colIdx}`}
                            style={{
                              ...bodyCellStyles,
                              textAlign: column.align || 'left',
                            }}
                            className={column.className}
                          >
                            <div className="transition-transform duration-300 group-hover:translate-x-0.5">
                              {renderCell(row, column, rowIndex)}
                            </div>
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 px-1">
                <div className="text-[10px] font-bold text-base-500 uppercase tracking-widest">
                  Page {pagination.currentPage} <span className="text-base-700 mx-2">/</span> {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="xs"
                    disabled={pagination.currentPage === 1}
                    onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Table.displayName = 'Table';
export default Table;
