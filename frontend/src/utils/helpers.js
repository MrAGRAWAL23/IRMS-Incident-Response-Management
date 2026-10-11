export function severityBadge(severity) {
  const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return map[severity] || 'badge-low';
}

export function statusBadge(status) {
  const map = {
    'New': 'badge-new',
    'Investigating': 'badge-investigating',
    'Contained': 'badge-contained',
    'Resolved': 'badge-resolved',
    'Closed': 'badge-closed',
    'False Positive': 'badge-false-positive',
  };
  return map[status] || 'badge-new';
}

export function roleBadge(role) {
  const map = { admin: 'badge-role-admin', analyst: 'badge-role-analyst', viewer: 'badge-role-viewer' };
  return map[role] || '';
}

export function riskClass(score) {
  if (score >= 81) return 'risk-critical';
  if (score >= 61) return 'risk-high';
  if (score >= 31) return 'risk-medium';
  return 'risk-low';
}

export function riskCategory(score) {
  if (score >= 81) return 'Critical';
  if (score >= 61) return 'High';
  if (score >= 31) return 'Medium';
  return 'Low';
}

export function formatDate(dt) {
  if (!dt) return '—';
  try {
    return new Date(dt.replace(' ', 'T') + (dt.includes('Z') ? '' : 'Z')).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return dt; }
}

export function formatDateTime(dt) {
  if (!dt) return '—';
  try {
    return new Date(dt.replace(' ', 'T') + (dt.includes('Z') ? '' : 'Z')).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return dt; }
}

export function timelineIcon(eventType) {
  const icons = {
    incident_created: '🔵',
    incident_assigned: '👤',
    severity_updated: '⚠️',
    note_added: '📝',
    evidence_added: '🔍',
    ai_analysis: '🤖',
    action_recorded: '⚡',
    status_changed: '🔄',
  };
  return icons[eventType] || '●';
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

export function apiError(err) {
  return err?.response?.data?.error || err?.message || 'An error occurred';
}

export const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
export const TYPE_OPTIONS = ['Phishing', 'Malware', 'Brute Force', 'Suspicious Login', 'Data Breach', 'Unauthorized Access', 'Ransomware', 'Other'];
export const STATUS_OPTIONS = ['New', 'Investigating', 'Contained', 'Resolved', 'Closed', 'False Positive'];
export const ACTION_TYPES = ['Block IP', 'Reset Password', 'Disable Account', 'Isolate Device', 'Block Domain', 'Remove Malware', 'Restore System', 'Other'];
export const EVIDENCE_TYPES = ['Log', 'Screenshot', 'IP Address', 'Domain', 'File Hash', 'Document', 'Other'];
export const ASSET_IMPORTANCE_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
export const THREAT_CONFIDENCE_OPTIONS = ['Low', 'Medium', 'High'];
