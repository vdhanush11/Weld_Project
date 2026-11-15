import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  ShieldCheck, 
  PieChart, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { formatScore } from '../utils/formatters';

export default function StatsDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        Loading inspection metrics...
      </div>
    );
  }

  const passRate = stats.total_inspections > 0
    ? ((stats.good_count / stats.total_inspections) * 100).toFixed(1)
    : '0.0';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Industrial Welding Quality Analytics</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time quality metrics and defect frequency distribution
          </p>
        </div>
        <button
          onClick={fetchStats}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Inspected */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              TOTAL INSPECTED
            </span>
            <BarChart3 size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#f8fafc' }}>
            {stats.total_inspections}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Processed through YOLO model
          </div>
        </div>

        {/* First Time Pass Rate */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              PASS RATE (GOOD)
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#10b981' }}>
            {passRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.good_count} Acceptable Welds
          </div>
        </div>

        {/* Defect Rate */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              DEFECT RATE
            </span>
            <AlertOctagon size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#f43f5e' }}>
            {stats.defect_rate_percent}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.bad_count} Defective Welds Flagged
          </div>
        </div>

        {/* Avg Quality Score */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              AVG QUALITY SCORE
            </span>
            <TrendingUp size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#38bdf8' }}>
            {formatScore(stats.avg_quality_score)}
            <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Mean quality across batch
          </div>
        </div>

        {/* Avg Latency */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              AVG LATENCY
            </span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#f59e0b' }}>
            {stats.avg_processing_time_ms}
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px' }}>ms</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time inference speed
          </div>
        </div>
      </div>

      {/* Defect Distribution Breakdown */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Defect Frequency by Category
        </h3>

        {stats.defect_distribution.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No specific defect instances recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.defect_distribution.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.class_name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fb7185' }}>
                    {d.count} occurrences ({d.percentage}%)
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${d.percentage}%`,
                    height: '100%',
                    borderRadius: '4px',
                    background: 'linear-gradient(90deg, #f43f5e, #fb7185)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
