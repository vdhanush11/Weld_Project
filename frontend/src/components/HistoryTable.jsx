import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate, formatScore, getStatusStyle, getConfidenceBadge } from '../utils/formatters';

export default function HistoryTable({ onSelectInspection }) {
  const [historyData, setHistoryData] = useState({ total: 0, page: 1, limit: 10, total_pages: 1, items: [] });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getHistory(statusFilter, page, 10, sortOrder);
      setHistoryData(data);
    } catch (err) {
      setErrorMsg('Failed to load inspection history.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, sortOrder, page]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete inspection record ${id}?`)) {
      return;
    }
    try {
      await api.deleteInspection(id);
      fetchHistory();
    } catch (err) {
      alert('Failed to delete inspection.');
    }
  };

  const handleRowClick = async (id) => {
    try {
      const fullDetail = await api.getInspectionById(id);
      onSelectInspection(fullDetail);
    } catch (err) {
      alert('Failed to load full inspection details.');
    }
  };

  const filteredItems = historyData.items.filter((item) => {
    if (!searchTerm) return true;
    return item.inspection_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.overall_status.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const exportCSV = () => {
    if (!historyData.items.length) return;
    const headers = ["Inspection_ID", "Date_UTC", "Verdict", "Quality_Score", "Defect_Count", "Confidence", "Model_Version", "Latency_MS"];
    const rows = historyData.items.map(i => [
      i.inspection_id,
      i.timestamp,
      i.overall_status,
      i.quality_score,
      i.defect_count,
      i.confidence_category,
      i.model_version,
      i.processing_time_ms
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `weld_inspection_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header & Filter Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
            Inspection History & Audit Log
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            TOTAL RECORDS: {historyData.total}
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'GOOD', 'BAD', 'UNCERTAIN'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: statusFilter === st ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                background: statusFilter === st ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: statusFilter === st ? '#38bdf8' : 'var(--text-secondary)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}

          <button
            onClick={exportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchHistory}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Inspection ID or Verdict..."
          style={{
            width: '100%',
            padding: '10px 14px 10px 36px',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '13px'
          }}
        />
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>THUMBNAIL</th>
              <th style={{ padding: '12px 16px' }}>INSPECTION ID</th>
              <th style={{ padding: '12px 16px' }}>TIMESTAMP (UTC)</th>
              <th style={{ padding: '12px 16px' }}>VERDICT</th>
              <th style={{ padding: '12px 16px' }}>QUALITY SCORE</th>
              <th style={{ padding: '12px 16px' }}>DEFECTS</th>
              <th style={{ padding: '12px 16px' }}>LATENCY</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading inspection records...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No inspection records found.
                </td>
              </tr>
            ) : (
              filteredItems.map((row) => {
                const style = getStatusStyle(row.overall_status);
                const conf = getConfidenceBadge(row.confidence_category);
                return (
                  <tr
                    key={row.inspection_id}
                    onClick={() => handleRowClick(row.inspection_id)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: '10px 16px' }}>
                      <img
                        src={row.annotated_image_url}
                        alt="Thumbnail"
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid var(--border-subtle)',
                          background: '#000'
                        }}
                      />
                    </td>

                    {/* ID */}
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#38bdf8' }}>
                      {row.inspection_id.substring(0, 8)}...
                    </td>

                    {/* Date */}
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                      {formatDate(row.timestamp)}
                    </td>

                    {/* Verdict */}
                    <td style={{ padding: '10px 16px' }}>
                      <span className={style.badgeClass} style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700
                      }}>
                        {row.overall_status}
                      </span>
                    </td>

                    {/* Quality Score */}
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: style.textColor }}>
                      {formatScore(row.quality_score)}
                    </td>

                    {/* Defects */}
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: row.defect_count > 0 ? '#fb7185' : '#34d399' }}>
                      {row.defect_count}
                    </td>

                    {/* Latency */}
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {row.processing_time_ms} ms
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRowClick(row.inspection_id); }}
                          title="View Full Inspection Report"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            cursor: 'pointer'
                          }}
                        >
                          <ExternalLink size={14} />
                        </button>

                        <button
                          onClick={(e) => handleDelete(row.inspection_id, e)}
                          title="Delete Inspection"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            color: '#fb7185',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }}>
        <span>
          PAGE {historyData.page} OF {historyData.total_pages} ({historyData.total} TOTAL)
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(historyData.total_pages, p + 1))}
            disabled={page >= historyData.total_pages}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: page >= historyData.total_pages ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page >= historyData.total_pages ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
