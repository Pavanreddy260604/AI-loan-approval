import React from 'react';
import { EmptyState } from './EmptyState';
import { Card } from './Card';

/**
 * EmptyState Component Demo
 * 
 * Visual demonstration of all EmptyState variants and functionality.
 * This file serves as both documentation and manual testing.
 */
export const EmptyStateDemo: React.FC = () => {
  // Custom icons for different scenarios
  const SearchIcon = () => (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: '#52525b' }}
    >
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  const FolderIcon = () => (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: '#52525b' }}
    >
      <path
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-7l-2-2H5a2 2 0 00-2 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ChartIcon = () => (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: '#52525b' }}
    >
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 14l4-4 3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const BellIcon = () => (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: '#10b981' }}
    >
      <path
        d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>EmptyState Component Demo</h1>

      {/* Basic Empty States */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Basic Empty States</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Default (No Action)</h3>
          <Card>
            <EmptyState
              title="No data available"
              description="There are currently no items to display."
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>With Action Button</h3>
          <Card>
            <EmptyState
              title="No items found"
              description="Get started by adding your first item."
              actionText="Add Item"
              onAction={() => alert('Add item clicked!')}
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>With Secondary Action</h3>
          <Card>
            <EmptyState
              title="No data yet"
              description="Import data to get started."
              actionText="Import Data"
              onAction={() => alert('Import clicked!')}
              actionVariant="secondary"
            />
          </Card>
        </div>
      </section>

      {/* Custom Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Custom Icons</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Search Icon</h3>
          <Card>
            <EmptyState
              icon={<SearchIcon />}
              title="No results found"
              description="Try adjusting your search criteria or filters."
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Folder Icon</h3>
          <Card>
            <EmptyState
              icon={<FolderIcon />}
              title="No files uploaded"
              description="Upload your first file to get started."
              actionText="Upload File"
              onAction={() => alert('Upload clicked!')}
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Chart Icon</h3>
          <Card>
            <EmptyState
              icon={<ChartIcon />}
              title="No analytics data"
              description="Start tracking to see your analytics dashboard."
              actionText="Start Tracking"
              onAction={() => alert('Start tracking clicked!')}
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Emoji Icon</h3>
          <Card>
            <EmptyState
              icon={<span style={{ fontSize: '64px' }}>📭</span>}
              title="Inbox empty"
              description="You're all caught up! No new messages."
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Success State</h3>
          <Card>
            <EmptyState
              icon={<BellIcon />}
              title="All caught up!"
              description="You have no new notifications."
            />
          </Card>
        </div>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Real-world Examples</h2>
        
        {/* Loan Applications */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Loan List</h3>
          <Card>
            <EmptyState
              icon={<span style={{ fontSize: '64px' }}>💼</span>}
              title="No loan applications"
              description="Create your first loan application to start tracking and managing loans."
              actionText="New Loan Application"
              onAction={() => alert('Create loan clicked!')}
              actionVariant="primary"
            />
          </Card>
        </div>

        {/* Datasets */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Dataset List</h3>
          <Card>
            <EmptyState
              icon={<span style={{ fontSize: '64px' }}>📊</span>}
              title="No datasets found"
              description="Upload your first dataset to get started with loan predictions and analytics."
              actionText="Upload Dataset"
              onAction={() => alert('Upload dataset clicked!')}
            />
          </Card>
        </div>

        {/* Models */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Model List</h3>
          <Card>
            <EmptyState
              icon={<span style={{ fontSize: '64px' }}>🤖</span>}
              title="No models trained"
              description="Train your first machine learning model to start making predictions."
              actionText="Train Model"
              onAction={() => alert('Train model clicked!')}
            />
          </Card>
        </div>

        {/* Search Results */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Search Results</h3>
          <Card>
            <EmptyState
              icon={<SearchIcon />}
              title="No results found"
              description="We couldn't find any loans matching your search criteria. Try adjusting your filters."
            />
          </Card>
        </div>

        {/* Notifications */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Notifications</h3>
          <Card>
            <EmptyState
              icon={<BellIcon />}
              title="All caught up!"
              description="You have no new notifications. We'll notify you when something important happens."
            />
          </Card>
        </div>

        {/* Filtered Results */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Filtered Results</h3>
          <Card>
            <EmptyState
              icon={<span style={{ fontSize: '64px' }}>🔍</span>}
              title="No matching loans"
              description="No loans match your current filters. Try removing some filters to see more results."
              actionText="Clear Filters"
              onAction={() => alert('Clear filters clicked!')}
              actionVariant="outline"
            />
          </Card>
        </div>

        {/* Payment History */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Payment History</h3>
          <Card>
            <EmptyState
              icon={<span style={{ fontSize: '64px' }}>💳</span>}
              title="No payment history"
              description="Your payment history will appear here once you make your first payment."
            />
          </Card>
        </div>

        {/* Documents */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Documents</h3>
          <Card>
            <EmptyState
              icon={<FolderIcon />}
              title="No documents uploaded"
              description="Upload supporting documents for your loan application."
              actionText="Upload Documents"
              onAction={() => alert('Upload documents clicked!')}
            />
          </Card>
        </div>

        {/* Reports */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Reports</h3>
          <Card>
            <EmptyState
              icon={<ChartIcon />}
              title="No reports generated"
              description="Generate your first report to analyze loan performance and trends."
              actionText="Generate Report"
              onAction={() => alert('Generate report clicked!')}
            />
          </Card>
        </div>

        {/* Saved Searches */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Empty Saved Searches</h3>
          <Card>
            <EmptyState
              icon={<span style={{ fontSize: '64px' }}>⭐</span>}
              title="No saved searches"
              description="Save your frequently used search filters for quick access."
            />
          </Card>
        </div>
      </section>

      {/* Different Action Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Action Button Variants</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Primary Action</h3>
          <Card>
            <EmptyState
              title="Get started"
              description="Create your first item to begin."
              actionText="Create Item"
              onAction={() => alert('Primary action!')}
              actionVariant="primary"
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Secondary Action</h3>
          <Card>
            <EmptyState
              title="Import data"
              description="Import existing data to get started quickly."
              actionText="Import"
              onAction={() => alert('Secondary action!')}
              actionVariant="secondary"
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Outline Action</h3>
          <Card>
            <EmptyState
              title="Learn more"
              description="Explore our documentation to understand how this works."
              actionText="View Documentation"
              onAction={() => alert('Outline action!')}
              actionVariant="outline"
            />
          </Card>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Ghost Action</h3>
          <Card>
            <EmptyState
              title="Optional action"
              description="This is an optional action you can take."
              actionText="Maybe Later"
              onAction={() => alert('Ghost action!')}
              actionVariant="ghost"
            />
          </Card>
        </div>
      </section>

      {/* Usage Instructions */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Usage Instructions</h2>
        <Card>
          <div style={{ color: '#d4d4d8' }}>
            <h3 style={{ color: '#fafafa', marginBottom: '12px' }}>Basic Usage</h3>
            <pre style={{ 
              backgroundColor: '#18181b', 
              padding: '16px', 
              borderRadius: '8px', 
              overflow: 'auto',
              fontSize: '0.875rem',
              marginBottom: '16px'
            }}>
{`import { EmptyState } from './components/ui/molecules/EmptyState';

// Simple empty state
<EmptyState
  title="No data available"
  description="There are currently no items to display."
/>

// With action button
<EmptyState
  title="No loans found"
  description="Create your first loan application."
  actionText="New Loan"
  onAction={() => navigate('/loans/new')}
/>

// With custom icon
<EmptyState
  icon={<CustomIcon />}
  title="No results"
  description="Try adjusting your filters."
  actionText="Clear Filters"
  onAction={handleClearFilters}
  actionVariant="outline"
/>`}
            </pre>

            <h3 style={{ color: '#fafafa', marginBottom: '12px' }}>Props</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>title</strong>: string (required) - Main heading text</li>
              <li><strong>description</strong>: string (required) - Descriptive text</li>
              <li><strong>icon</strong>: ReactNode (optional) - Custom icon (defaults to inbox icon)</li>
              <li><strong>actionText</strong>: string (optional) - Action button text</li>
              <li><strong>onAction</strong>: function (optional) - Action button click handler</li>
              <li><strong>actionVariant</strong>: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' (default: 'primary')</li>
              <li><strong>className</strong>: string (optional) - Additional CSS classes</li>
            </ul>

            <h3 style={{ color: '#fafafa', marginTop: '16px', marginBottom: '12px' }}>Design Guidelines</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
              <li>Use clear, concise titles that describe the empty state</li>
              <li>Provide helpful descriptions that guide users on what to do next</li>
              <li>Include action buttons when users can take action to resolve the empty state</li>
              <li>Use custom icons that match the context (search, folder, chart, etc.)</li>
              <li>Keep descriptions under 2-3 lines for better readability</li>
              <li>Use primary variant for main actions, outline for secondary actions</li>
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default EmptyStateDemo;
