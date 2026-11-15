import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Sparkles, RefreshCw, Crosshair, AlertCircle } from 'lucide-react';

export default function CameraCapture({ onInspect, isAnalyzing }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [deviceId, setDeviceId] = useState('CAM-STATION-01');
  const [notes, setNotes] = useState('');

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Could not access camera device. Please grant browser camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedPreview(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.95
    );
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
    if (!cameraActive) {
      startCamera();
    }
  };

  const handleAnalyzeCaptured = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `cam_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
    onInspect(file, deviceId, notes);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Viewport Frame */}
      <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#040711',
          minHeight: '380px',
          maxHeight: '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}>
          {capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Captured Frame"
              style={{ width: '100%', height: '100%', maxHeight: '480px', objectFit: 'contain' }}
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '480px',
                  objectFit: 'cover',
                  display: cameraActive ? 'block' : 'none'
                }}
              />

              {!cameraActive && (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <CameraOff size={44} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                    Camera stream is inactive or permission is required
                  </p>
                  <button
                    onClick={startCamera}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    Activate Camera
                  </button>
                </div>
              )}

              {/* Scanning HUD Overlay when live */}
              {cameraActive && (
                <>
                  <div className="scanner-beam" />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    opacity: 0.6
                  }}>
                    <Crosshair size={120} color="#38bdf8" strokeWidth={1} />
                  </div>

                  {/* Top Bar Status */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} className="pulse-dot" />
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>LIVE CAMERA HUD</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

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
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Camera Control Bar */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {capturedPreview ? (
            <>
              <button
                onClick={handleRetake}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <RefreshCw size={16} />
                <span>Retake Frame</span>
              </button>

              <button
                onClick={handleAnalyzeCaptured}
                disabled={isAnalyzing}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)'
                }}
              >
                <Sparkles size={18} color="#38bdf8" />
                <span>{isAnalyzing ? 'ANALYZING WELD...' : 'INSPECT CAPTURED FRAME'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleCaptureSnapshot}
              disabled={!cameraActive}
              style={{
                padding: '12px 32px',
                borderRadius: '12px',
                background: cameraActive 
                  ? 'linear-gradient(135deg, #0284c7, #0369a1)' 
                  : 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: cameraActive ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: cameraActive ? '0 0 25px rgba(56, 189, 248, 0.3)' : 'none'
              }}
            >
              <Camera size={18} />
              <span>FREEZE & CAPTURE WELD SNAPSHOT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
