/**
 * Formatting and helper utilities for Welding App UI
 */

export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function formatScore(score) {
  if (score === undefined || score === null) return '0.0';
  return Number(score).toFixed(1);
}

export function getStatusStyle(status) {
  switch (status?.toUpperCase()) {
    case 'GOOD':
      return {
        label: 'GOOD WELD',
        badgeClass: 'badge-good',
        textColor: '#34d399',
        borderColor: 'rgba(16, 185, 129, 0.5)',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        glowColor: '0 0 20px rgba(16, 185, 129, 0.35)'
      };
    case 'BAD':
      return {
        label: 'DEFECT DETECTED',
        badgeClass: 'badge-bad',
        textColor: '#fb7185',
        borderColor: 'rgba(244, 63, 94, 0.5)',
        bgColor: 'rgba(244, 63, 94, 0.15)',
        glowColor: '0 0 20px rgba(244, 63, 94, 0.35)'
      };
    case 'UNCERTAIN':
    default:
      return {
        label: 'UNCERTAIN INSPECTION',
        badgeClass: 'badge-uncertain',
        textColor: '#fbbf24',
        borderColor: 'rgba(245, 158, 11, 0.5)',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        glowColor: '0 0 20px rgba(245, 158, 11, 0.35)'
      };
  }
}

export function getConfidenceBadge(category) {
  switch (category) {
    case 'HIGH_CONFIDENCE':
      return { label: 'HIGH CONFIDENCE', class: 'badge-good' };
    case 'MEDIUM_CONFIDENCE':
      return { label: 'MED CONFIDENCE', class: 'badge-cyan' };
    case 'LOW_CONFIDENCE':
      return { label: 'LOW CONFIDENCE', class: 'badge-uncertain' };
    case 'UNCERTAIN':
    default:
      return { label: 'MANUAL REVIEW', class: 'badge-uncertain' };
  }
}

export function getScoreCategory(score) {
  if (score >= 90) return { label: 'Flawless / High Quality', color: '#10b981' };
  if (score >= 75) return { label: 'Acceptable Industrial Standard', color: '#34d399' };
  if (score >= 50) return { label: 'Questionable / Low Margin', color: '#f59e0b' };
  return { label: 'Defective / Failed Quality Check', color: '#f43f5e' };
}
