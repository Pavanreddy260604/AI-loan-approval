import React, { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from '../atoms/Button';
import { Card } from './Card';

/**
 * ErrorBoundary Component Demo
 * 
 * Visual demonstration of ErrorBoundary functionality.
 * This file serves as both documentation and manual testing.
 */

// Component that throws an error on demand
const BrokenComponent: React.FC<{ shouldBreak: boolean; message?: string }> = ({ 
  shouldBreak, 
  message = 'Component error occurred' 
}) => {
  if (shouldBreak) {
    throw new Error(message);
  }
  return (
    <div style={{ padding: '24px', color: '#10b981' }}>
      ✓ Component is working correctly
    </div>
  );
};

// Component that throws after a delay
const DelayedError: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Delayed error triggered');
  }

  return (
    <div style={{ padding: '24px' }}>
      <p style={{ color: '#d4d4d8', marginBottom: '16px' }}>
        This component will throw an error when you click the button:
      </p>
      <Button variant="danger" onClick={() => setShouldThrow(true)}>
        Trigger Error
      </Button>
    </div>
  );
};

// Nested component structure
const NestedComponent: React.FC<{ level: number; shouldBreak: boolean }> = ({ level, shouldBreak }) => {
  if (shouldBreak && level === 3) {
    throw new Error('Error in deeply nested component');
  }

  if (level === 0) {
    return <div style={{ color: '#10b981' }}>✓ Nested structure working</div>;
  }

  return (
    <div className="pl-4 ml-2 bg-base-900/30 rounded-r-lg">
      <div className="text-base-400 text-sm mb-2">Level {level}</div>
      <NestedComponent level={level - 1} shouldBreak={shouldBreak} />
    </div>
  );
};

export const ErrorBoundaryDemo: React.FC = () => {
  const [breakBasic, setBreakBasic] = useState(false);
  const [breakCustomMessage, setBreakCustomMessage] = useState(false);
  const [breakCustomRecovery, setBreakCustomRecovery] = useState(false);
  const [breakCustomFallback, setBreakCustomFallback] = useState(false);
  const [breakNested, setBreakNested] = useState(false);
  const [breakWithCallback, setBreakWithCallback] = useState(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  const logError = (error: Error) => {
    const timestamp = new Date().toLocaleTimeString();
    setErrorLog(prev => [...prev, `[${timestamp}] ${error.message}`]);
  };

  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>
        ErrorBoundary Component Demo
      </h1>

      {/* Basic Error Boundary */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          Basic Error Boundary
        </h2>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              variant={breakBasic ? 'secondary' : 'danger'}
              onClick={() => setBreakBasic(!breakBasic)}
            >
              {breakBasic ? 'Fix Component' : 'Break Component'}
            </Button>
          </div>
          <ErrorBoundary>
            <BrokenComponent shouldBreak={breakBasic} />
          </ErrorBoundary>
        </Card>
      </section>

      {/* Custom Error Message */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          Custom Error Message
        </h2>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              variant={breakCustomMessage ? 'secondary' : 'danger'}
              onClick={() => setBreakCustomMessage(!breakCustomMessage)}
            >
              {breakCustomMessage ? 'Fix Component' : 'Break Component'}
            </Button>
          </div>
          <ErrorBoundary errorMessage="We're sorry, but this feature is temporarily unavailable. Our team has been notified and is working on a fix.">
            <BrokenComponent shouldBreak={breakCustomMessage} />
          </ErrorBoundary>
        </Card>
      </section>

      {/* Custom Recovery Text */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          Custom Recovery Button
        </h2>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              variant={breakCustomRecovery ? 'secondary' : 'danger'}
              onClick={() => setBreakCustomRecovery(!breakCustomRecovery)}
            >
              {breakCustomRecovery ? 'Fix Component' : 'Break Component'}
            </Button>
          </div>
          <ErrorBoundary 
            errorMessage="Unable to load your dashboard. Please refresh the page."
            recoveryText="Refresh Dashboard"
          >
            <BrokenComponent shouldBreak={breakCustomRecovery} />
          </ErrorBoundary>
        </Card>
      </section>

      {/* Custom Fallback UI */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          Custom Fallback UI
        </h2>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              variant={breakCustomFallback ? 'secondary' : 'danger'}
              onClick={() => setBreakCustomFallback(!breakCustomFallback)}
            >
              {breakCustomFallback ? 'Fix Component' : 'Break Component'}
            </Button>
          </div>
          <ErrorBoundary
            fallback={(error, _errorInfo, reset) => (
              <div style={{
                padding: '32px',
                backgroundColor: '#18181b',
                borderRadius: '12px',
                border: '2px solid #ef4444',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔥</div>
                <h3 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '8px' }}>
                  Oops! Something broke
                </h3>
                <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
                  Error: {error.message}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Button variant="primary" onClick={reset}>
                    Try Again
                  </Button>
                  <Button variant="ghost" onClick={() => window.location.href = '/'}>
                    Go Home
                  </Button>
                </div>
              </div>
            )}
          >
            <BrokenComponent shouldBreak={breakCustomFallback} message="Custom fallback error" />
          </ErrorBoundary>
        </Card>
      </section>

      {/* Nested Error Boundaries */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          Nested Error Boundaries
        </h2>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              variant={breakNested ? 'secondary' : 'danger'}
              onClick={() => setBreakNested(!breakNested)}
            >
              {breakNested ? 'Fix Component' : 'Break Nested Component'}
            </Button>
          </div>
          <ErrorBoundary errorMessage="Outer boundary caught an error">
            <div style={{ padding: '16px', backgroundColor: '#18181b', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ color: '#d4d4d8', marginBottom: '8px' }}>Outer Boundary</p>
              <ErrorBoundary errorMessage="Inner boundary caught an error in nested component">
                <div style={{ padding: '16px', backgroundColor: '#27272a', borderRadius: '8px' }}>
                  <p style={{ color: '#d4d4d8', marginBottom: '8px' }}>Inner Boundary</p>
                  <NestedComponent level={3} shouldBreak={breakNested} />
                </div>
              </ErrorBoundary>
            </div>
          </ErrorBoundary>
        </Card>
      </section>

      {/* Error Callback */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          Error Logging with Callback
        </h2>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              variant={breakWithCallback ? 'secondary' : 'danger'}
              onClick={() => setBreakWithCallback(!breakWithCallback)}
            >
              {breakWithCallback ? 'Fix Component' : 'Break Component'}
            </Button>
            {errorLog.length > 0 && (
              <Button 
                variant="ghost" 
                onClick={() => setErrorLog([])}
                style={{ marginLeft: '12px' }}
              >
                Clear Log
              </Button>
            )}
          </div>
          <ErrorBoundary 
            onError={(error) => logError(error)}
            errorMessage="An error was logged. Check the error log below."
          >
            <BrokenComponent shouldBreak={breakWithCallback} message="Logged error occurred" />
          </ErrorBoundary>
          
          {errorLog.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#18181b',
              borderRadius: '8px',
              border: '1px solid #27272a'
            }}>
              <h4 style={{ color: '#fafafa', marginBottom: '8px', fontSize: '0.875rem' }}>
                Error Log:
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {errorLog.map((log, index) => (
                  <li 
                    key={index} 
                    style={{ 
                      color: '#ef4444', 
                      fontSize: '0.75rem', 
                      fontFamily: 'monospace',
                      marginBottom: '4px'
                    }}
                  >
                    {log}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      {/* Delayed Error */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          User-Triggered Error
        </h2>
        <Card>
          <ErrorBoundary errorMessage="The action you performed caused an error.">
            <DelayedError />
          </ErrorBoundary>
        </Card>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          Real-world Examples
        </h2>

        {/* Dashboard Widget */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>
            Dashboard Widget Error
          </h3>
          <Card>
            <ErrorBoundary 
              errorMessage="Unable to load dashboard widget. This widget may be temporarily unavailable."
              recoveryText="Reload Widget"
            >
              <div style={{ padding: '24px' }}>
                <h4 style={{ color: '#fafafa', marginBottom: '8px' }}>Loan Performance</h4>
                <p style={{ color: '#a1a1aa' }}>Widget content would appear here...</p>
              </div>
            </ErrorBoundary>
          </Card>
        </div>

        {/* Data Table */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>
            Data Table Error
          </h3>
          <Card>
            <ErrorBoundary 
              errorMessage="Failed to load table data. Please try refreshing the page."
              recoveryText="Refresh Table"
            >
              <div style={{ padding: '24px' }}>
                <h4 style={{ color: '#fafafa', marginBottom: '8px' }}>Recent Loans</h4>
                <p style={{ color: '#a1a1aa' }}>Table data would appear here...</p>
              </div>
            </ErrorBoundary>
          </Card>
        </div>

        {/* Form Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>
            Form Section Error
          </h3>
          <Card>
            <ErrorBoundary 
              errorMessage="Unable to load form. Please contact support if this issue persists."
              recoveryText="Reload Form"
            >
              <div style={{ padding: '24px' }}>
                <h4 style={{ color: '#fafafa', marginBottom: '8px' }}>Loan Application</h4>
                <p style={{ color: '#a1a1aa' }}>Form fields would appear here...</p>
              </div>
            </ErrorBoundary>
          </Card>
        </div>
      </section>

      {/* Usage Instructions */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>
          Usage Instructions
        </h2>
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
{`import { ErrorBoundary } from './components/ui/molecules/ErrorBoundary';

// Basic error boundary
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom error message
<ErrorBoundary errorMessage="Failed to load data">
  <DataTable />
</ErrorBoundary>

// With custom recovery text
<ErrorBoundary 
  errorMessage="Dashboard unavailable"
  recoveryText="Reload Dashboard"
>
  <Dashboard />
</ErrorBoundary>

// With error callback
<ErrorBoundary 
  onError={(error, errorInfo) => {
    logErrorToService(error, errorInfo);
  }}
>
  <CriticalComponent />
</ErrorBoundary>

// With custom fallback UI
<ErrorBoundary
  fallback={(error, errorInfo, reset) => (
    <div>
      <h2>Custom Error UI</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>`}
            </pre>

            <h3 style={{ color: '#fafafa', marginBottom: '12px' }}>Props</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>children</strong>: Components to monitor for errors</li>
              <li><strong>fallback</strong>: Custom fallback UI function (error, errorInfo, reset) =&gt; ReactNode</li>
              <li><strong>onError</strong>: Callback when error is caught (error, errorInfo) =&gt; void</li>
              <li><strong>errorMessage</strong>: Custom error message to display</li>
              <li><strong>recoveryText</strong>: Custom recovery button text (default: "Try Again")</li>
              <li><strong>className</strong>: Additional CSS classes</li>
            </ul>

            <h3 style={{ color: '#fafafa', marginTop: '16px', marginBottom: '12px' }}>
              Best Practices
            </h3>
            <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
              <li>Wrap entire page sections or routes with error boundaries</li>
              <li>Use multiple error boundaries to isolate failures</li>
              <li>Provide helpful error messages that guide users</li>
              <li>Log errors to monitoring services using onError callback</li>
              <li>Test error boundaries with intentional errors in development</li>
              <li>Consider different recovery actions based on context</li>
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ErrorBoundaryDemo;
