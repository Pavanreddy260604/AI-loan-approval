import React from 'react';
import { Tooltip } from './Tooltip';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

/**
 * Tooltip Component Demo
 * 
 * Visual demonstration of all Tooltip variants and options.
 * This file serves as both documentation and manual testing.
 */
export const TooltipDemo: React.FC = () => {
  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>Tooltip Component Demo</h1>

      {/* Basic Tooltip */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Basic Tooltip</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Tooltip content="This is a basic tooltip">
            <Button variant="primary">Hover me</Button>
          </Tooltip>
          <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
            Hover over the button to see the tooltip (300ms delay)
          </p>
        </div>
      </section>

      {/* Placement Options */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Placement Options</h2>
        
        {/* Cardinal Directions */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Cardinal Directions</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '16px',
            maxWidth: '800px'
          }}>
            <Tooltip content="Top tooltip" placement="top">
              <Button variant="outline" size="sm">Top</Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" placement="bottom">
              <Button variant="outline" size="sm">Bottom</Button>
            </Tooltip>
            <Tooltip content="Left tooltip" placement="left">
              <Button variant="outline" size="sm">Left</Button>
            </Tooltip>
            <Tooltip content="Right tooltip" placement="right">
              <Button variant="outline" size="sm">Right</Button>
            </Tooltip>
          </div>
        </div>

        {/* Top Variants */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Top Variants</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            maxWidth: '600px'
          }}>
            <Tooltip content="Top start" placement="top-start">
              <Button variant="outline" size="sm">Top Start</Button>
            </Tooltip>
            <Tooltip content="Top center" placement="top">
              <Button variant="outline" size="sm">Top Center</Button>
            </Tooltip>
            <Tooltip content="Top end" placement="top-end">
              <Button variant="outline" size="sm">Top End</Button>
            </Tooltip>
          </div>
        </div>

        {/* Bottom Variants */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Bottom Variants</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            maxWidth: '600px'
          }}>
            <Tooltip content="Bottom start" placement="bottom-start">
              <Button variant="outline" size="sm">Bottom Start</Button>
            </Tooltip>
            <Tooltip content="Bottom center" placement="bottom">
              <Button variant="outline" size="sm">Bottom Center</Button>
            </Tooltip>
            <Tooltip content="Bottom end" placement="bottom-end">
              <Button variant="outline" size="sm">Bottom End</Button>
            </Tooltip>
          </div>
        </div>

        {/* Left Variants */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Left Variants</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            maxWidth: '600px'
          }}>
            <Tooltip content="Left start" placement="left-start">
              <Button variant="outline" size="sm">Left Start</Button>
            </Tooltip>
            <Tooltip content="Left center" placement="left">
              <Button variant="outline" size="sm">Left Center</Button>
            </Tooltip>
            <Tooltip content="Left end" placement="left-end">
              <Button variant="outline" size="sm">Left End</Button>
            </Tooltip>
          </div>
        </div>

        {/* Right Variants */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Right Variants</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            maxWidth: '600px'
          }}>
            <Tooltip content="Right start" placement="right-start">
              <Button variant="outline" size="sm">Right Start</Button>
            </Tooltip>
            <Tooltip content="Right center" placement="right">
              <Button variant="outline" size="sm">Right Center</Button>
            </Tooltip>
            <Tooltip content="Right end" placement="right-end">
              <Button variant="outline" size="sm">Right End</Button>
            </Tooltip>
          </div>
        </div>
      </section>

      {/* Delay Options */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Delay Options</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Tooltip content="No delay" delay={0}>
            <Button variant="outline" size="sm">0ms delay</Button>
          </Tooltip>
          <Tooltip content="Short delay" delay={150}>
            <Button variant="outline" size="sm">150ms delay</Button>
          </Tooltip>
          <Tooltip content="Default delay" delay={300}>
            <Button variant="outline" size="sm">300ms delay (default)</Button>
          </Tooltip>
          <Tooltip content="Long delay" delay={500}>
            <Button variant="outline" size="sm">500ms delay</Button>
          </Tooltip>
          <Tooltip content="Very long delay" delay={1000}>
            <Button variant="outline" size="sm">1000ms delay</Button>
          </Tooltip>
        </div>
      </section>

      {/* Different Trigger Elements */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Different Trigger Elements</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Tooltip content="Primary button tooltip">
            <Button variant="primary" size="md">Primary Button</Button>
          </Tooltip>
          
          <Tooltip content="Secondary button tooltip">
            <Button variant="secondary" size="md">Secondary Button</Button>
          </Tooltip>
          
          <Tooltip content="Danger button tooltip">
            <Button variant="danger" size="md">Danger Button</Button>
          </Tooltip>
          
          <Tooltip content="Badge tooltip">
            <Badge tone="success">Active</Badge>
          </Tooltip>
          
          <Tooltip content="Text tooltip">
            <span style={{ 
              color: '#d4d4d8', 
              textDecoration: 'underline', 
              textDecorationStyle: 'dotted',
              cursor: 'help'
            }}>
              Hover over this text
            </span>
          </Tooltip>
          
          <Tooltip content="Icon tooltip">
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: '#635BFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              ?
            </div>
          </Tooltip>
        </div>
      </section>

      {/* Complex Content */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Complex Content</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Tooltip content={<span>Tooltip with <strong>bold</strong> text</span>}>
            <Button variant="outline" size="sm">Bold Content</Button>
          </Tooltip>
          
          <Tooltip content={<span style={{ color: '#10b981' }}>Colored tooltip text</span>}>
            <Button variant="outline" size="sm">Colored Content</Button>
          </Tooltip>
          
          <Tooltip content={
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '16px' }}>✓</span>
              <span>Success message</span>
            </div>
          }>
            <Button variant="outline" size="sm">With Icon</Button>
          </Tooltip>
        </div>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Real-world Examples</h2>
        
        {/* Help Icons */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Help Icons</h3>
          <div style={{ 
            backgroundColor: '#18181b', 
            padding: '24px', 
            borderRadius: '8px',
            maxWidth: '600px'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#d4d4d8',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '8px'
              }}>
                Email Address
                <Tooltip content="We'll never share your email with anyone else" placement="right">
                  <span style={{ 
                    width: '16px', 
                    height: '16px', 
                    borderRadius: '50%', 
                    border: '1px solid #a1a1aa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: '#a1a1aa',
                    cursor: 'help'
                  }}>
                    ?
                  </span>
                </Tooltip>
              </label>
              <input 
                type="email" 
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '4px',
                  color: '#d4d4d8',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#d4d4d8',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '8px'
              }}>
                Password Strength
                <Tooltip content="Use at least 8 characters with a mix of letters, numbers, and symbols" placement="right">
                  <span style={{ 
                    width: '16px', 
                    height: '16px', 
                    borderRadius: '50%', 
                    border: '1px solid #a1a1aa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: '#a1a1aa',
                    cursor: 'help'
                  }}>
                    ?
                  </span>
                </Tooltip>
              </label>
              <input 
                type="password" 
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '4px',
                  color: '#d4d4d8',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Action Buttons</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip content="Save changes" placement="bottom">
              <Button variant="primary" size="sm">💾</Button>
            </Tooltip>
            <Tooltip content="Edit document" placement="bottom">
              <Button variant="outline" size="sm">✏️</Button>
            </Tooltip>
            <Tooltip content="Delete permanently" placement="bottom">
              <Button variant="danger" size="sm">🗑️</Button>
            </Tooltip>
            <Tooltip content="Share with team" placement="bottom">
              <Button variant="outline" size="sm">📤</Button>
            </Tooltip>
            <Tooltip content="Download file" placement="bottom">
              <Button variant="outline" size="sm">⬇️</Button>
            </Tooltip>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Status Indicators</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Tooltip content="Application approved on Jan 15, 2024" placement="top">
              <Badge tone="success">Approved</Badge>
            </Tooltip>
            <Tooltip content="Waiting for document verification" placement="top">
              <Badge tone="warning">Pending</Badge>
            </Tooltip>
            <Tooltip content="Application rejected due to incomplete information" placement="top">
              <Badge tone="danger">Rejected</Badge>
            </Tooltip>
            <Tooltip content="Currently under review by loan officer" placement="top">
              <Badge tone="info">In Review</Badge>
            </Tooltip>
            <Tooltip content="Draft saved on Jan 10, 2024" placement="top">
              <Badge tone="ghost">Draft</Badge>
            </Tooltip>
          </div>
        </div>

        {/* Data Table Headers */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Data Table Headers</h3>
          <div style={{ 
            backgroundColor: '#18181b', 
            padding: '16px', 
            borderRadius: '8px',
            maxWidth: '800px'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 1fr', 
              gap: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #27272a'
            }}>
              <Tooltip content="Full name of the applicant" placement="bottom-start">
                <div style={{ 
                  color: '#a1a1aa', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'help'
                }}>
                  Applicant Name
                </div>
              </Tooltip>
              <Tooltip content="Total loan amount requested" placement="bottom">
                <div style={{ 
                  color: '#a1a1aa', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'help'
                }}>
                  Amount
                </div>
              </Tooltip>
              <Tooltip content="Current application status" placement="bottom">
                <div style={{ 
                  color: '#a1a1aa', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'help'
                }}>
                  Status
                </div>
              </Tooltip>
              <Tooltip content="AI-calculated risk score (0-100)" placement="bottom-end">
                <div style={{ 
                  color: '#a1a1aa', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'help'
                }}>
                  Risk Score
                </div>
              </Tooltip>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 1fr', 
              gap: '16px',
              paddingTop: '12px',
              color: '#d4d4d8',
              fontSize: '0.875rem'
            }}>
              <div>John Smith</div>
              <div>$250,000</div>
              <div><Badge tone="success" size="xs">Approved</Badge></div>
              <div>85</div>
            </div>
          </div>
        </div>

        {/* Disabled Elements */}
        <div>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Disabled Elements</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Tooltip content="This feature is not available in your current plan">
              <Button variant="outline" size="sm" disabled>
                Premium Feature
              </Button>
            </Tooltip>
            <Tooltip content="Complete the previous step first">
              <Button variant="primary" size="sm" disabled>
                Next Step
              </Button>
            </Tooltip>
          </div>
        </div>
      </section>

      {/* Layout Test */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Layout Test</h2>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '16px' }}>
          Testing tooltips in different layout contexts
        </p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '48px',
          backgroundColor: '#18181b',
          borderRadius: '8px'
        }}>
          <Tooltip content="Top left corner" placement="bottom-start">
            <Button variant="outline" size="sm">Top Left</Button>
          </Tooltip>
          <Tooltip content="Top center" placement="bottom">
            <Button variant="outline" size="sm">Top Center</Button>
          </Tooltip>
          <Tooltip content="Top right corner" placement="bottom-end">
            <Button variant="outline" size="sm">Top Right</Button>
          </Tooltip>
        </div>
      </section>
    </div>
  );
};

export default TooltipDemo;
