import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  FileJson, 
  Printer, 
  Layers, 
  Clock, 
  Cpu, 
  Maximize2, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { formatDate, formatScore, getStatusStyle, getConfidenceBadge, getScoreCategory } from '../utils/formatters';

export default function AnalysisViewer({ inspection, onNewInspection }) {
  const [viewMode, setViewMode] = useState('annotated'); // 'annotated', 'original', 'split'
  const [hoveredDetectionIndex, setHoveredDetectionIndex] = useState(null);

  if (!inspection) return null;

  const statusStyle = getStatusStyle(inspection.overall_status);
  const confBadge = getConfidenceBadge(inspection.confidence_category);
  const scoreCat = getScoreCategory(inspection.quality_score);

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = inspection.annotated_image_url;
    link.download = `weld_inspection_${inspection.inspection_id}_annotated.jpg`;
    link.target = '_blank';
    link.click();
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inspection, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `weld_inspection_${inspection.inspection_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      {/* Top Banner: Verdict & Main Score */}
      <div 
        className="glass-panel"
        style={{
          padding: '24px 32px',
          borderLeft: `6px solid ${statusStyle.textColor}`,
          background: `linear-gradient(90deg, ${statusStyle.bgColor} 0%, rgba(15, 23, 42, 0.7) 100%)`,
          boxShadow: statusStyle.glowColor
        }}
      >
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          {/* Left: Overall Verdict */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: statusStyle.bgColor,
              border: `1px solid ${statusStyle.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {inspection.overall_status === 'GOOD' && <CheckCircle2 size={32} color="#10b981" />}
              {inspection.overall_status === 'BAD' && <XCircle size={32} color="#f43f5e" />}
              {inspection.overall_status === 'UNCERTAIN' && <AlertTriangle size={32} color="#f59e0b" />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: statusStyle.textColor
                }}>
                  {statusStyle.label}
                </h2>
                <span className={confBadge.class} style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600
                }}>
                  {confBadge.label}
                </span>
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', maxWidth: '650px' }}>
                {inspection.decision_reason}
              </p>
            </div>
          </div>

          {/* Right: Quality Score Metric */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px 24px',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'right' }}>
                WELD QUALITY SCORE
              </div>
              <div style={{ fontSize: '12px', color: scoreCat.color, fontWeight: 500, textAlign: 'right' }}>
                {scoreCat.label}
              </div>
            </div>
            <div style={{
              fontSize: '36px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              color: scoreCat.color,
              lineHeight: 1
            }}>
              {formatScore(inspection.quality_score)}
              <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Inspection Studio Grid (Image Viewer + Telemetry) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Left Column: Visual Inspector with View Modes */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {/* Header Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#38bdf8" />
              <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                INSPECTION VISUALIZER
              </span>
            </div>

            {/* View Mode Selector */}
            <div style={{
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setViewMode('annotated')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'annotated' ? '#0284c7' : 'transparent',
                  color: viewMode === 'annotated' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                AI Annotated
              </button>
              <button
                onClick={() => setViewMode('original')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'original' ? '#0284c7' : 'transparent',
                  color: viewMode === 'original' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Original Raw
              </button>
              <button
                onClick={() => setViewMode('split')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'split' ? '#0284c7' : 'transparent',
                  color: viewMode === 'split' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Split View
              </button>
            </div>
          </div>

          {/* Visual Display Container */}
          <div style={{
            position: 'relative',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#040711',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {viewMode === 'annotated' && (
              <img
                src={inspection.annotated_image_url}
                alt="AI Annotated Weld"
                style={{
                  width: '100%',
                  maxHeight: '520px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            )}

            {viewMode === 'original' && (
              <img
                src={inspection.original_image_url}
                alt="Original Clean Weld"
                style={{
                  width: '100%',
                  maxHeight: '520px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            )}

            {viewMode === 'split' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%', gap: '4px' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={inspection.original_image_url}
                    alt="Original"
                    style={{ width: '100%', maxHeight: '520px', objectFit: 'contain' }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    ORIGINAL
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <img
                    src={inspection.annotated_image_url}
                    alt="Annotated"
                    style={{ width: '100%', maxHeight: '520px', objectFit: 'contain' }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8'
                  }}>
                    YOLO ANNOTATED
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              RES: {inspection.image_width}x{inspection.image_height}px
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleDownloadImage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <Download size={14} />
                <span>Save Annotated Image</span>
              </button>

              <button
                onClick={handleDownloadJSON}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <FileJson size={14} />
                <span>JSON</span>
              </button>

              <button
                onClick={handlePrintReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <Printer size={14} />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry, Explanation & Detections Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Telemetry Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: '16px', color: '#38bdf8' }}>
              INSPECTION METADATA
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INSPECTION ID</div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {inspection.inspection_id.substring(0, 16)}...
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DATE / TIME</div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                  {formatDate(inspection.timestamp)}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MODEL VERSION</div>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {inspection.model_version}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INFERENCE LATENCY</div>
                <div style={{ fontSize: '12px', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {inspection.processing_time_ms} ms
                </div>
              </div>
            </div>
          </div>

          {/* Detections Breakdown Card */}
          <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                LOCALIZED DETECTIONS ({inspection.detections.length})
              </h3>
              <span className={inspection.defect_count > 0 ? 'badge-bad' : 'badge-good'} style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600
              }}>
                {inspection.defect_count} DEFECTS
              </span>
            </div>

            {inspection.detections.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '8px',
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '13px'
              }}>
                No bounding boxes detected above threshold.
              </div>
            ) : (
              <div style={{
                overflowY: 'auto',
                maxHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {inspection.detections.map((det, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDetectionIndex(idx)}
                    onMouseLeave={() => setHoveredDetectionIndex(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: hoveredDetectionIndex === idx ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                      border: hoveredDetectionIndex === idx ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        background: det.is_defect ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: det.is_defect ? '#fb7185' : '#34d399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {det.class_name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Box: [{Math.round(det.bbox.x1)}, {Math.round(det.bbox.y1)}] to [{Math.round(det.bbox.x2)}, {Math.round(det.bbox.y2)}]
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: det.is_defect ? '#fb7185' : '#34d399'
                      }}>
                        {(det.confidence * 100).toFixed(1)}%
                      </div>
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: det.is_defect ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: det.is_defect ? '#fb7185' : '#34d399',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {det.is_defect ? 'DEFECT' : 'ACCEPTABLE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Inspection Action */}
          <button
            onClick={onNewInspection}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>+ INSPECT ANOTHER WELDING SPECIMEN</span>
          </button>
        </div>
      </div>

      {/* Safety Notice Disclaimer */}
      <div style={{
        padding: '12px 18px',
        borderRadius: '8px',
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
        fontSize: '12px'
      }}>
        <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
        <span>
          <strong>Industrial AI Safety Disclaimer:</strong> This automated computer vision result is designed for real-time quality assistance and triage. Critical structural welds marked defective or uncertain must be verified in accordance with standard non-destructive testing (NDT/CWI) protocols.
        </span>
      </div>
    </div>
  );
}
