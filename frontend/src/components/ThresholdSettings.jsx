import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ThresholdSettings({ isOpen, onClose, onThresholdsUpdated }) {
  const [defectThresh, setDefectThresh] = useState(0.50);
  const [uncertaintyThresh, setUncertaintyThresh] = useState(0.35);
  const [detectionThresh, setDetectionThresh] = useState(0.25);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.getModelInfo().then((info) => {
        if (info?.thresholds) {
          setDefectThresh(info.thresholds.defect_confidence_threshold);
          setUncertaintyThresh(info.thresholds.uncertainty_threshold);
          setDetectionThresh(info.thresholds.confidence_threshold);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await api.updateThresholds({
        defect_confidence_threshold: defectThresh,
        uncertainty_threshold: uncertaintyThresh,
        confidence_threshold: detectionThresh
      });
      setSuccessMsg('Thresholds updated successfully!');
      if (onThresholdsUpdated) onThresholdsUpdated();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 800);
    } catch (err) {
      alert('Failed to update thresholds.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '28px',
          background: '#0d1527',
          border: '1px solid var(--border-active)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Decision Threshold Configuration</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Tune industrial confidence gates and business logic thresholds dynamically in runtime without restarting the server.
        </p>

        {/* Sliders Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Defect Threshold */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#fb7185' }}>
                DEFECT TRIGGER THRESHOLD (BAD)
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fb7185' }}>
                {(defectThresh * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.05"
              value={defectThresh}
              onChange={(e) => setDefectThresh(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#f43f5e' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              If a detected defect confidence exceeds this value, the overall weld status is marked as <strong>BAD</strong>.
            </p>
          </div>

          {/* Uncertainty Threshold */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#fbbf24' }}>
                UNCERTAINTY / MANUAL REVIEW THRESHOLD
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fbbf24' }}>
                {(uncertaintyThresh * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.70"
              step="0.05"
              value={uncertaintyThresh}
              onChange={(e) => setUncertaintyThresh(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Predictions below this confidence are classified as <strong>UNCERTAIN</strong> for human manual inspection.
            </p>
          </div>

          {/* YOLO Detection Threshold */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                YOLO NMS DETECTION THRESHOLD
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                {(detectionThresh * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={detectionThresh}
              onChange={(e) => setDetectionThresh(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Raw bounding box filter threshold for model inference output.
            </p>
          </div>
        </div>

        {successMsg && (
          <div style={{
            marginTop: '16px',
            padding: '10px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {successMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            {isSaving ? 'Applying...' : 'Save & Apply Thresholds'}
          </button>
        </div>
      </div>
    </div>
  );
}
