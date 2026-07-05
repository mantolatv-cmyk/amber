import React from 'react';
import styles from './dashboard.module.css';

export default function DashboardLoading() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Welcome Header Skeleton */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="skeleton" style={{ height: '36px', width: '250px', marginBottom: '8px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ height: '20px', width: '180px', borderRadius: '6px' }}></div>
        </div>
        <div className="skeleton" style={{ height: '40px', width: '140px', borderRadius: '8px' }}></div>
      </div>

      {/* Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', gridColumn: 'span 2' }}>
          {/* Section 1 */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px' }}>
            <div className="skeleton" style={{ height: '28px', width: '200px', marginBottom: '24px', borderRadius: '6px' }}></div>
            <div className="skeleton" style={{ height: '140px', width: '100%', borderRadius: '12px' }}></div>
          </div>
          
          {/* Section 2 */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px' }}>
            <div className="skeleton" style={{ height: '28px', width: '150px', marginBottom: '24px', borderRadius: '6px' }}></div>
            <div className="skeleton" style={{ height: '80px', width: '100%', marginBottom: '12px', borderRadius: '8px' }}></div>
            <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '8px' }}></div>
          </div>
        </div>

        {/* Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Stats Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px' }}>
            <div className="skeleton" style={{ height: '24px', width: '120px', marginBottom: '20px', borderRadius: '6px' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="skeleton" style={{ height: '80px', borderRadius: '12px' }}></div>
              <div className="skeleton" style={{ height: '80px', borderRadius: '12px' }}></div>
            </div>
          </div>

          {/* List Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px' }}>
            <div className="skeleton" style={{ height: '24px', width: '140px', marginBottom: '20px', borderRadius: '6px' }}></div>
            <div className="skeleton" style={{ height: '48px', width: '100%', marginBottom: '12px', borderRadius: '8px' }}></div>
            <div className="skeleton" style={{ height: '48px', width: '100%', marginBottom: '12px', borderRadius: '8px' }}></div>
            <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '8px' }}></div>
          </div>
        </div>

      </div>
    </div>
  );
}
