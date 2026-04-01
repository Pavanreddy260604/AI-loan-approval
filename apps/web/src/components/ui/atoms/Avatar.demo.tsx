import React from 'react';
import { Avatar } from './Avatar';

/**
 * Avatar Component Demo
 * 
 * Demonstrates all variants, sizes, and states of the Avatar component.
 */
export const AvatarDemo: React.FC = () => {
  const [loading, setLoading] = React.useState(false);

  return (
    <div style={{ padding: '2rem', backgroundColor: '#09090b', minHeight: '100vh' }}>
      <h1 style={{ color: '#f4f4f5', marginBottom: '2rem' }}>Avatar Component Demo</h1>

      {/* Size Variants */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Size Variants</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <Avatar initials="XS" size="xs" />
            <p style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.5rem' }}>XS (24px)</p>
          </div>
          <div>
            <Avatar initials="SM" size="sm" />
            <p style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.5rem' }}>SM (32px)</p>
          </div>
          <div>
            <Avatar initials="MD" size="md" />
            <p style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.5rem' }}>MD (40px)</p>
          </div>
          <div>
            <Avatar initials="LG" size="lg" />
            <p style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.5rem' }}>LG (48px)</p>
          </div>
          <div>
            <Avatar initials="XL" size="xl" />
            <p style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.5rem' }}>XL (64px)</p>
          </div>
        </div>
      </section>

      {/* Initials Display */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Initials Display</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Avatar initials="JD" size="md" alt="John Doe" />
          <Avatar initials="AB" size="md" alt="Alice Brown" />
          <Avatar initials="MK" size="md" alt="Mike Kim" />
          <Avatar initials="SR" size="md" alt="Sarah Rodriguez" />
          <Avatar initials="TC" size="md" alt="Tom Chen" />
        </div>
      </section>

      {/* Image Display */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Image Display</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Avatar 
            src="https://i.pravatar.cc/150?img=1" 
            alt="User 1" 
            size="md" 
          />
          <Avatar 
            src="https://i.pravatar.cc/150?img=2" 
            alt="User 2" 
            size="md" 
          />
          <Avatar 
            src="https://i.pravatar.cc/150?img=3" 
            alt="User 3" 
            size="md" 
          />
          <Avatar 
            src="https://i.pravatar.cc/150?img=4" 
            alt="User 4" 
            size="md" 
          />
        </div>
      </section>

      {/* Fallback Behavior */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Fallback Behavior</h2>
        <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>
          When image fails to load, initials are displayed as fallback
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Avatar 
            src="/broken-image.jpg" 
            initials="FB" 
            alt="Fallback Example" 
            size="md" 
          />
          <Avatar 
            src="/another-broken.jpg" 
            initials="ER" 
            alt="Error Example" 
            size="md" 
          />
        </div>
      </section>

      {/* Loading State */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Loading State</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <Avatar loading size="xs" />
          <Avatar loading size="sm" />
          <Avatar loading size="md" />
          <Avatar loading size="lg" />
          <Avatar loading size="xl" />
        </div>
        <button
          onClick={() => setLoading(!loading)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#635BFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Toggle Loading State
        </button>
        <div style={{ marginTop: '1rem' }}>
          <Avatar 
            src="https://i.pravatar.cc/150?img=5" 
            initials="LD" 
            loading={loading} 
            size="lg" 
          />
        </div>
      </section>

      {/* Different Sizes with Images */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Different Sizes with Images</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Avatar src="https://i.pravatar.cc/150?img=6" alt="User" size="xs" />
          <Avatar src="https://i.pravatar.cc/150?img=7" alt="User" size="sm" />
          <Avatar src="https://i.pravatar.cc/150?img=8" alt="User" size="md" />
          <Avatar src="https://i.pravatar.cc/150?img=9" alt="User" size="lg" />
          <Avatar src="https://i.pravatar.cc/150?img=10" alt="User" size="xl" />
        </div>
      </section>

      {/* Custom Styling */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Custom Styling</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Avatar 
            initials="CS" 
            size="md" 
            className="custom-avatar"
            style={{ border: '2px solid #635BFF' }}
          />
          <Avatar 
            initials="CS" 
            size="md" 
            style={{ border: '2px solid #10b981' }}
          />
          <Avatar 
            initials="CS" 
            size="md" 
            style={{ border: '2px solid #f59e0b' }}
          />
        </div>
      </section>

      {/* Usage Examples */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#f4f4f5', marginBottom: '1rem' }}>Usage Examples</h2>
        
        {/* User Profile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          padding: '1rem',
          backgroundColor: '#18181b',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <Avatar src="https://i.pravatar.cc/150?img=11" alt="John Doe" size="lg" />
          <div>
            <h3 style={{ color: '#f4f4f5', margin: 0 }}>John Doe</h3>
            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.875rem' }}>john.doe@example.com</p>
          </div>
        </div>

        {/* Comment Thread */}
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#18181b',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <Avatar initials="AB" size="sm" />
            <div>
              <p style={{ color: '#f4f4f5', margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                Alice Brown
              </p>
              <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.875rem' }}>
                This looks great! When can we ship it?
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Avatar initials="MK" size="sm" />
            <div>
              <p style={{ color: '#f4f4f5', margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                Mike Kim
              </p>
              <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.875rem' }}>
                Should be ready by end of week!
              </p>
            </div>
          </div>
        </div>

        {/* User List */}
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#18181b',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#f4f4f5', marginTop: 0 }}>Team Members</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Avatar src="https://i.pravatar.cc/150?img=12" alt="Team member" size="md" />
            <Avatar src="https://i.pravatar.cc/150?img=13" alt="Team member" size="md" />
            <Avatar src="https://i.pravatar.cc/150?img=14" alt="Team member" size="md" />
            <Avatar initials="+5" size="md" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AvatarDemo;
