import React, { Suspense } from 'react';

// Lazy load the heavy chart component
const HeavyChart = React.lazy(() => import('../components/HeavyChart.jsx'));

export default function ProjectsPage() {
  return (
    <div className="panel" style={{ marginTop: '20px' }}>
      <h2>Projects</h2>
      <p style={{ color: 'var(--muted)' }}>This is a dummy page to demonstrate lazy loading of routes.</p>

      
      <div style={{ marginTop: '30px' }}>
        <h3>Task Progress (Heavy Component)</h3>
        {/* Fallback for the heavy component specifically */}
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      </div>
    </div>
  );
}
