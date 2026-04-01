import React from 'react';
import { Card } from './Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

/**
 * Card Component Demo
 * 
 * Visual demonstration of all Card variants and options.
 * This file serves as both documentation and manual testing.
 */
export const CardDemo: React.FC = () => {
  return (
    <div style={{ padding: '48px', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#fafafa', marginBottom: '32px', fontSize: '2rem' }}>Card Component Demo</h1>

      {/* Basic Card */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Basic Card</h2>
        <Card>
          <p style={{ color: '#d4d4d8' }}>This is a basic card with default settings.</p>
        </Card>
      </section>

      {/* Card with Header */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Card with Header</h2>
        <Card header={<h3 style={{ color: '#fafafa', margin: 0 }}>Card Title</h3>}>
          <p style={{ color: '#d4d4d8' }}>This card has a header section with a title.</p>
        </Card>
      </section>

      {/* Card with Footer */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Card with Footer</h2>
        <Card footer={<Button variant="primary" size="sm">Action</Button>}>
          <p style={{ color: '#d4d4d8' }}>This card has a footer section with an action button.</p>
        </Card>
      </section>

      {/* Card with Header and Footer */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Card with Header and Footer</h2>
        <Card 
          header={<h3 style={{ color: '#fafafa', margin: 0 }}>Complete Card</h3>}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm">Cancel</Button>
              <Button variant="primary" size="sm">Save</Button>
            </div>
          }
        >
          <p style={{ color: '#d4d4d8' }}>This card has both header and footer sections.</p>
        </Card>
      </section>

      {/* Hoverable Card */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Hoverable Card</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <Card hoverable>
            <p style={{ color: '#d4d4d8' }}>Hover over me to see the effect!</p>
          </Card>
          <Card hoverable>
            <p style={{ color: '#d4d4d8' }}>I'm also hoverable!</p>
          </Card>
          <Card hoverable>
            <p style={{ color: '#d4d4d8' }}>Try hovering here too!</p>
          </Card>
        </div>
      </section>

      {/* Card without Padding */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Card without Padding</h2>
        <Card padded={false}>
          <div style={{ padding: '16px', backgroundColor: '#18181b' }}>
            <p style={{ color: '#d4d4d8', margin: 0 }}>This card has no padding. Content can extend to edges.</p>
          </div>
        </Card>
      </section>

      {/* Card without Border */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Card without Border</h2>
        <Card border={false}>
          <p style={{ color: '#d4d4d8' }}>This card has no border, creating a cleaner look.</p>
        </Card>
      </section>

      {/* Combined Options */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Combined Options</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <Card hoverable border={false}>
            <p style={{ color: '#d4d4d8' }}>Hoverable without border</p>
          </Card>
          <Card hoverable padded={false}>
            <div style={{ padding: '16px' }}>
              <p style={{ color: '#d4d4d8', margin: 0 }}>Hoverable without padding</p>
            </div>
          </Card>
          <Card border={false} padded={false}>
            <div style={{ padding: '16px' }}>
              <p style={{ color: '#d4d4d8', margin: 0 }}>No border, no padding</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: '#d4d4d8', marginBottom: '16px', fontSize: '1.5rem' }}>Real-world Examples</h2>
        
        {/* User Profile Card */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>User Profile Card</h3>
          <Card 
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#fafafa', margin: 0 }}>John Doe</h3>
                <Badge tone="success" size="xs">Active</Badge>
              </div>
            }
            footer={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" style={{ flex: 1 }}>Message</Button>
                <Button variant="primary" size="sm" style={{ flex: 1 }}>View Profile</Button>
              </div>
            }
          >
            <div style={{ color: '#d4d4d8' }}>
              <p style={{ marginTop: 0 }}>Senior Loan Officer</p>
              <p style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>
                Specializes in commercial loans and has 10+ years of experience.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Badge tone="ghost" size="xs">Commercial</Badge>
                <Badge tone="ghost" size="xs">Residential</Badge>
                <Badge tone="primary" size="xs">Expert</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Loan Application Card */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Loan Application Card</h3>
          <Card 
            hoverable
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: '#fafafa', margin: 0 }}>Application #12345</h3>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    Submitted 2 days ago
                  </p>
                </div>
                <Badge tone="warning" size="sm">Under Review</Badge>
              </div>
            }
            footer={
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="sm">View Details</Button>
                <Button variant="primary" size="sm">Review</Button>
              </div>
            }
          >
            <div style={{ color: '#d4d4d8' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 4px 0' }}>Applicant</p>
                  <p style={{ margin: 0 }}>Jane Smith</p>
                </div>
                <div>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 4px 0' }}>Amount</p>
                  <p style={{ margin: 0 }}>$250,000</p>
                </div>
                <div>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 4px 0' }}>Type</p>
                  <p style={{ margin: 0 }}>Home Mortgage</p>
                </div>
                <div>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 4px 0' }}>Risk Score</p>
                  <p style={{ margin: 0 }}>72/100</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge tone="info" size="xs">High Priority</Badge>
                <Badge tone="ghost" size="xs">30-year term</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Statistics Card */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Statistics Card</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Card border={false}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Total Applications</p>
                <p style={{ color: '#fafafa', fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0' }}>1,234</p>
                <Badge tone="success" size="xs">+12% this month</Badge>
              </div>
            </Card>
            <Card border={false}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Approved</p>
                <p style={{ color: '#fafafa', fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0' }}>892</p>
                <Badge tone="success" size="xs">72% approval rate</Badge>
              </div>
            </Card>
            <Card border={false}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Pending</p>
                <p style={{ color: '#fafafa', fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0' }}>156</p>
                <Badge tone="warning" size="xs">Needs review</Badge>
              </div>
            </Card>
            <Card border={false}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Rejected</p>
                <p style={{ color: '#fafafa', fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0' }}>186</p>
                <Badge tone="danger" size="xs">15% rejection rate</Badge>
              </div>
            </Card>
          </div>
        </div>

        {/* Image Card */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Image Card</h3>
          <div style={{ maxWidth: '400px' }}>
            <Card padded={false}>
              <div style={{ 
                height: '200px', 
                backgroundColor: '#27272a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#a1a1aa'
              }}>
                [Image Placeholder]
              </div>
              <div style={{ padding: '24px' }}>
                <h3 style={{ color: '#fafafa', margin: '0 0 8px 0' }}>Property Listing</h3>
                <p style={{ color: '#d4d4d8', margin: '0 0 16px 0' }}>
                  Beautiful 3-bedroom home in prime location. Perfect for families.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fafafa', fontSize: '1.5rem', fontWeight: 700 }}>$450,000</span>
                  <Button variant="primary" size="sm">View Details</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Notification Card */}
        <div>
          <h3 style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '1rem' }}>Notification Cards</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
            <Card hoverable border={false}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#635BFF',
                  marginTop: '6px',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fafafa', margin: '0 0 4px 0', fontWeight: 500 }}>
                    New loan application received
                  </p>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
                    Application #12346 from Michael Johnson - 5 minutes ago
                  </p>
                </div>
              </div>
            </Card>
            <Card hoverable border={false}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#10b981',
                  marginTop: '6px',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fafafa', margin: '0 0 4px 0', fontWeight: 500 }}>
                    Application approved
                  </p>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
                    Application #12340 has been approved - 1 hour ago
                  </p>
                </div>
              </div>
            </Card>
            <Card hoverable border={false}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#f59e0b',
                  marginTop: '6px',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fafafa', margin: '0 0 4px 0', fontWeight: 500 }}>
                    Document verification required
                  </p>
                  <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
                    Application #12338 needs additional documents - 3 hours ago
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CardDemo;
