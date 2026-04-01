import React from 'react';
import { Table } from './Table';
import { Badge } from '../atoms/Badge';

/**
 * Table Component Demo
 * 
 * Demonstrates the Table component with various features:
 * - Sorting
 * - Pagination
 * - Row selection
 * - Loading state
 * - Empty state
 */

interface LoanData {
  id: string;
  borrowerName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

const mockLoans: LoanData[] = [
  { id: '1', borrowerName: 'Alice Johnson', amount: 50000, status: 'approved', date: '2024-01-15' },
  { id: '2', borrowerName: 'Bob Smith', amount: 75000, status: 'pending', date: '2024-01-16' },
  { id: '3', borrowerName: 'Charlie Brown', amount: 30000, status: 'rejected', date: '2024-01-17' },
  { id: '4', borrowerName: 'Diana Prince', amount: 100000, status: 'approved', date: '2024-01-18' },
  { id: '5', borrowerName: 'Ethan Hunt', amount: 45000, status: 'pending', date: '2024-01-19' },
];

export const TableDemo: React.FC = () => {
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<string>('');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortBy(column);
    setSortDirection(direction);
  };

  const getStatusBadge = (status: string) => {
    const toneMap = {
      approved: 'success' as const,
      pending: 'warning' as const,
      rejected: 'danger' as const,
    };
    return <Badge tone={toneMap[status as keyof typeof toneMap]}>{status}</Badge>;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>Table Component Demo</h1>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Full-Featured Table</h2>
        <Table
          data={mockLoans}
          columns={[
            { header: 'Borrower Name', accessor: 'borrowerName', sortable: true },
            { 
              header: 'Amount', 
              accessor: (row) => `$${row.amount.toLocaleString()}`,
              sortable: true,
              align: 'right',
              key: 'amount'
            },
            { 
              header: 'Status', 
              accessor: (row) => getStatusBadge(row.status),
              key: 'status'
            },
            { header: 'Date', accessor: 'date', sortable: true },
          ]}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          pagination={{
            currentPage,
            totalPages: Math.ceil(mockLoans.length / 3),
            pageSize: 3,
            totalItems: mockLoans.length,
            onPageChange: setCurrentPage,
          }}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSort}
        />
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#a1a1aa' }}>
          Selected rows: {selectedRows.length > 0 ? selectedRows.join(', ') : 'None'}
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Loading State</h2>
        <Table
          data={mockLoans}
          columns={[
            { header: 'Name', accessor: 'borrowerName' },
            { header: 'Amount', accessor: 'amount' },
          ]}
          loading
        />
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Empty State</h2>
        <Table
          data={[]}
          columns={[
            { header: 'Name', accessor: 'borrowerName' },
            { header: 'Amount', accessor: 'amount' },
          ]}
          emptyMessage="No loans found"
          emptyDescription="Start by creating your first loan application."
        />
      </div>
    </div>
  );
};

export default TableDemo;
