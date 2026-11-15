import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

const SAMPLE_IMAGES = [
  {
    name: 'Sample Defective Weld (Slag/Porosity)',
    path: 'datasets/The Welding Defect Dataset/train/images/Slag-inclusion-welding-images_10_jpeg_jpg.rf.fabe6926703c8e26c2bd865286c3beb3.jpg',
    badge: 'DEFECT'
  },
  {
    name: 'Sample Bad Weld Bead',
    path: 'datasets/The Welding Defect Dataset/train/images/bad_weld_vid687_jpeg_jpg.rf.38ed9c3806fc2ff68dea2ccafcc431ab.jpg',
    badge: 'DEFECT'
  },
  {
    name: 'Sample Good Weld Seam',
    path: 'datasets/The Welding Defect Dataset/valid/images/good_weld_vid335_jpeg_jpg.rf.d4350ef91e4aa99e19273c52a0a256a0.jpg',
    badge: 'GOOD'
  }
];

export default function ImageUploader({ onInspect, isAnalyzing }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [notes, setNotes] = useState('');
  const [deviceId, setDeviceId] = useState('STATION-A1');
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    setErrorMsg(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      setErrorMsg('Unsupported file format. Please upload JPG, PNG, or WEBP images.');
      return;
    }

    // Validate size (< 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File size exceeds 25MB limit.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleStartAnalysis = () => {
    if (!selectedFile) {
      setErrorMsg('Please select or upload a welding image first.');
      return;
    }
    onInspect(selectedFile, deviceId, notes);
  };

  const handleLoadSample = async (sample) => {
    try {
      setErrorMsg(null);
      // Fetch sample via backend static route
      const cleanPath = sample.path.replace(/\\/g, '/');
      const response = await fetch(`/static/${cleanPath}`);
      if (!response.ok) {
        // Fallback: create mock blob
        throw new Error('Could not load sample file path directly.');
      }
      const blob = await response.blob();
      const file = new File([blob], sample.name.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg', { type: 'image/jpeg' });
      handleFileSelect(file);
    } catch (e) {
      setErrorMsg('Click "Browse File" to select a weld image from your local datasets folder.');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      {/* Upload Dropzone Container */}
      <div 
        className="glass-panel"
        style={{
          padding: '32px',
          border: isDragging ? '2px dashed #38bdf8' : '1px solid var(--border-subtle)',
          background: isDragging ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-card)',
          transition: 'all 0.2s ease',
          textAlign: 'center',
          position: 'relative'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
        />

        {previewUrl ? (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 0 25px rgba(0, 0, 0, 0.6)'
            }}>
              <img
                src={previewUrl}
                alt="Weld Preview"
                style={{
                  width: '100%',
                  maxHeight: '360px',
                  objectFit: 'contain',
                  display: 'block',
                  background: '#050811'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8'
              }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Change Image
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Upload size={28} color="#38bdf8" />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Drag & Drop Welding Image Here
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Supports High-Resolution JPG, PNG, WEBP (Up to 25MB)
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)'
              }}
            >
              Browse Local File
            </button>
          </div>
        )}

        {errorMsg && (
          <div style={{
            marginTop: '16px',
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Inspection Meta & Action Bar */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              INSPECTION STATION / DEVICE ID
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. ROBOTIC-CELL-04"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              INSPECTOR NOTES (OPTIONAL)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pipe joint #38 - Post GMAW pass"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
          </div>
        </div>

        {/* Trigger Button */}
        <button
          onClick={handleStartAnalysis}
          disabled={!selectedFile || isAnalyzing}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: isAnalyzing 
              ? 'rgba(30, 41, 59, 0.8)' 
              : 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '0.02em',
            fontFamily: 'var(--font-heading)',
            cursor: (!selectedFile || isAnalyzing) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: (!selectedFile || isAnalyzing) ? 'none' : '0 8px 24px rgba(2, 132, 199, 0.35)',
            transition: 'all 0.2s ease'
          }}
        >
          {isAnalyzing ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>RUNNING YOLO DEFECT DETECTION INFERENCE...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} color="#38bdf8" />
              <span>ANALYZE WELDING QUALITY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
