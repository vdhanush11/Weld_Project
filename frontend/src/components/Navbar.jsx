import React from 'react';
import { Activity, ShieldCheck, Cpu, Sliders, History, BarChart3, Scan, RefreshCw } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  health, 
  modelInfo, 
  onOpenSettings,
  onRefreshHealth 
}) {
  const isHealthy = health?.status === 'healthy';

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(11, 17, 32, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 24px'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.2))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)'
          }}>
            <Scan size={24} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(90deg, #f8fafc, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                WELD-AI
              </span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                PRO v1.0
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              YOLO INDUSTRIAL QUALITY DETECTION SUITE
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveTab('studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'studio' ? '1px solid var(--border-active)' : '1px solid transparent',
              background: activeTab === 'studio' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'studio' ? '#38bdf8' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            <Scan size={16} />
            <span>Inspection Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'history' ? '1px solid var(--border-active)' : '1px solid transparent',
              background: activeTab === 'history' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'history' ? '#38bdf8' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            <History size={16} />
            <span>Records & History</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'analytics' ? '1px solid var(--border-active)' : '1px solid transparent',
              background: activeTab === 'analytics' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'analytics' ? '#38bdf8' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Right: Telemetry & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Health Pill */}
          <div 
            title="Click to refresh system status"
            onClick={onRefreshHealth}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isHealthy ? '#10b981' : '#f43f5e',
              boxShadow: isHealthy ? '0 0 8px #10b981' : '0 0 8px #f43f5e'
            }} className="pulse-dot" />
            <span style={{ color: isHealthy ? '#34d399' : '#fb7185' }}>
              {isHealthy ? 'AI ONLINE' : 'DEGRADED'}
            </span>
          </div>

          {/* Model Tag */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}>
            <Cpu size={14} color="#38bdf8" />
            <span>{modelInfo?.model_version || 'weld-yolo-v1'}</span>
            <span style={{ color: '#64748b' }}>({health?.hardware || 'CPU'})</span>
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Threshold Settings"
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border-active)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <Sliders size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
