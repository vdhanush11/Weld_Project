import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ImageUploader from './components/ImageUploader';
import CameraCapture from './components/CameraCapture';
import AnalysisViewer from './components/AnalysisViewer';
import HistoryTable from './components/HistoryTable';
import StatsDashboard from './components/StatsDashboard';
import ThresholdSettings from './components/ThresholdSettings';
import { api } from './services/api';
import { Upload, Camera, Sparkles, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio', 'history', 'analytics'
  const [studioMode, setStudioMode] = useState('upload'); // 'upload', 'camera'
  const [currentInspection, setCurrentInspection] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [health, setHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load health and model info on mount
  const loadSystemInfo = async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
      const m = await api.getModelInfo();
      setModelInfo(m);
    } catch (e) {
      console.warn('Backend not reachable yet:', e);
    }
  };

  useEffect(() => {
    loadSystemInfo();
    const interval = setInterval(loadSystemInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleInspectImage = async (fileOrBlob, deviceId, notes) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await api.inspectImage(fileOrBlob, deviceId, notes);
      setCurrentInspection(result);
    } catch (err) {
      console.error('Inspection error:', err);
      setErrorMsg(err.message || 'An error occurred during welding inspection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectFromHistory = (fullInspection) => {
    setCurrentInspection(fullInspection);
    setActiveTab('studio');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        modelInfo={modelInfo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshHealth={loadSystemInfo}
      />

      {/* Main Content Area */}
      <main className="app-container" style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Error Alert Banner */}
        {errorMsg && (
          <div style={{
            marginBottom: '24px',
            padding: '14px 20px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fb7185',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Tab View */}
        {activeTab === 'studio' && (
          <div>
            {currentInspection ? (
              <AnalysisViewer
                inspection={currentInspection}
                onNewInspection={() => setCurrentInspection(null)}
              />
            ) : (
              <div>
                {/* Studio Mode Selector (Upload vs Camera) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '28px'
                }}>
                  <div style={{
                    display: 'flex',
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <button
                      onClick={() => setStudioMode('upload')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: studioMode === 'upload' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                        color: studioMode === 'upload' ? '#fff' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Upload size={16} />
                      <span>Upload / Gallery Image</span>
                    </button>

                    <button
                      onClick={() => setStudioMode('camera')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: studioMode === 'camera' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                        color: studioMode === 'camera' ? '#fff' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Camera size={16} />
                      <span>Live Camera Viewfinder</span>
                    </button>
                  </div>
                </div>

                {/* Sub-view Content */}
                {studioMode === 'upload' ? (
                  <ImageUploader
                    onInspect={handleInspectImage}
                    isAnalyzing={isAnalyzing}
                  />
                ) : (
                  <CameraCapture
                    onInspect={handleInspectImage}
                    isAnalyzing={isAnalyzing}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab View */}
        {activeTab === 'history' && (
          <HistoryTable onSelectInspection={handleSelectFromHistory} />
        )}

        {/* Analytics Tab View */}
        {activeTab === 'analytics' && (
          <StatsDashboard />
        )}
      </main>

      {/* Threshold Configuration Modal */}
      <ThresholdSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onThresholdsUpdated={loadSystemInfo}
      />
    </div>
  );
}
