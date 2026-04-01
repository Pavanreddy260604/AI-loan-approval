import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table, TableColumn } from './Table';

interface TestData {
  id: string;
  name: string;
  age: number;
  status: string;
}

const mockData: TestData[] = [
  { id: '1', name: 'Alice', age: 30, status: 'active' },
  { id: '2', name: 'Bob', age: 25, status: 'inactive' },
  { id: '3', name: 'Charlie', age: 35, status: 'active' },
];

const mockColumns: TableColumn<TestData>[] = [
  { header: 'Name', accessor: 'name', sortable: true },
  { header: 'Age', accessor: 'age', sortable: true, align: 'right' },
  { header: 'Status', accessor: 'status' },
];

describe('Table Component', () => {
  it('renders table with data', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays empty state when no data', () => {
    render(
      <Table
        data={[]}
        columns={mockColumns}
        emptyMessage="No records found"
        emptyDescription="Try adding some data"
      />
    );
    
    expect(screen.getByText('No records found')).toBeInTheDocument();
    expect(screen.getByText('Try adding some data')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<Table data={mockData} columns={mockColumns} loading />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading table data...')).toBeInTheDocument();
  });

  describe('Sorting', () => {
    it('calls onSortChange when sortable column header is clicked', () => {
      const handleSortChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          onSortChange={handleSortChange}
        />
      );
      
      const nameHeader = screen.getByText('Name').closest('th');
      fireEvent.click(nameHeader!);
      
      expect(handleSortChange).toHaveBeenCalledWith('name', 'asc');
    });

    it('toggles sort direction on repeated clicks', () => {
      const handleSortChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          sortBy="name"
          sortDirection="asc"
          onSortChange={handleSortChange}
        />
      );
      
      const nameHeader = screen.getByText('Name').closest('th');
      fireEvent.click(nameHeader!);
      
      expect(handleSortChange).toHaveBeenCalledWith('name', 'desc');
    });

    it('does not call onSortChange for non-sortable columns', () => {
      const handleSortChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          onSortChange={handleSortChange}
        />
      );
      
      const statusHeader = screen.getByText('Status').closest('th');
      fireEvent.click(statusHeader!);
      
      expect(handleSortChange).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls when enabled', () => {
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          pagination={{
            currentPage: 1,
            totalPages: 2,
            pageSize: 2,
            onPageChange: vi.fn(),
          }}
        />
      );
      
      expect(screen.getByText(/Page 1/)).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('calls onPageChange when next button is clicked', () => {
      const handlePageChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          pagination={{
            currentPage: 1,
            totalPages: 2,
            pageSize: 2,
            onPageChange: handlePageChange,
          }}
        />
      );
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when previous button is clicked', () => {
      const handlePageChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          pagination={{
            currentPage: 2,
            totalPages: 2,
            pageSize: 2,
            onPageChange: handlePageChange,
          }}
        />
      );
      
      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);
      
      expect(handlePageChange).toHaveBeenCalledWith(1);
    });

    it('disables previous button on first page', () => {
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          pagination={{
            currentPage: 1,
            totalPages: 2,
            pageSize: 2,
            onPageChange: vi.fn(),
          }}
        />
      );
      
      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          pagination={{
            currentPage: 2,
            totalPages: 2,
            pageSize: 2,
            onPageChange: vi.fn(),
          }}
        />
      );
      
      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Row Selection', () => {
    it('displays checkboxes when selectable is true', () => {
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          selectable
          selectedRows={[]}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4); // 1 header + 3 rows
    });

    it('calls onSelectionChange when row is selected', () => {
      const handleSelectionChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          selectable
          selectedRows={[]}
          onSelectionChange={handleSelectionChange}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Click first row checkbox
      
      expect(handleSelectionChange).toHaveBeenCalledWith(['1']);
    });

    it('calls onSelectionChange when row is deselected', () => {
      const handleSelectionChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          selectable
          selectedRows={['1', '2']}
          onSelectionChange={handleSelectionChange}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Click first row checkbox
      
      expect(handleSelectionChange).toHaveBeenCalledWith(['2']);
    });

    it('selects all rows when header checkbox is clicked', () => {
      const handleSelectionChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          selectable
          selectedRows={[]}
          onSelectionChange={handleSelectionChange}
        />
      );
      
      const headerCheckbox = screen.getByLabelText('Select all rows');
      fireEvent.click(headerCheckbox);
      
      expect(handleSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
    });

    it('deselects all rows when header checkbox is clicked with all selected', () => {
      const handleSelectionChange = vi.fn();
      render(
        <Table
          data={mockData}
          columns={mockColumns}
          selectable
          selectedRows={['1', '2', '3']}
          onSelectionChange={handleSelectionChange}
        />
      );
      
      const headerCheckbox = screen.getByLabelText('Select all rows');
      fireEvent.click(headerCheckbox);
      
      expect(handleSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Custom Rendering', () => {
    it('renders custom cell content from accessor function', () => {
      const customColumns: TableColumn<TestData>[] = [
        {
          header: 'Name',
          accessor: (row) => <span data-testid="custom-cell">{row.name.toUpperCase()}</span>,
        },
      ];
      
      render(<Table data={mockData} columns={customColumns} />);
      
      expect(screen.getByText('ALICE')).toBeInTheDocument();
      expect(screen.getByText('BOB')).toBeInTheDocument();
    });
  });
});
