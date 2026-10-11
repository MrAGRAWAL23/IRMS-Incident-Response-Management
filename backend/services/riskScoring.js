/**
 * Risk Score Calculator
 *
 * Formula: Risk Score = Severity Points + Asset Importance Points + Potential Impact Points + Threat Confidence Points
 *
 * Severity (max 25):
 *   Low: 5, Medium: 12, High: 20, Critical: 25
 *
 * Asset Importance (max 25):
 *   Low: 5, Medium: 12, High: 20, Critical: 25
 *
 * Potential Impact (max 25):
 *   Low: 5, Medium: 12, High: 20, Critical: 25
 *
 * Threat Confidence (max 25):
 *   Low: 8, Medium: 17, High: 25
 *
 * Risk Categories:
 *   0–30: Low, 31–60: Medium, 61–80: High, 81–100: Critical
 */

const SEVERITY_POINTS = { Low: 5, Medium: 12, High: 20, Critical: 25 };
const ASSET_IMPORTANCE_POINTS = { Low: 5, Medium: 12, High: 20, Critical: 25 };
const POTENTIAL_IMPACT_POINTS = { Low: 5, Medium: 12, High: 20, Critical: 25 };
const THREAT_CONFIDENCE_POINTS = { Low: 8, Medium: 17, High: 25 };

function calculateRiskScore({ severity, asset_importance, potential_impact, threat_confidence }) {
  const s = SEVERITY_POINTS[severity] || 0;
  const a = ASSET_IMPORTANCE_POINTS[asset_importance] || 0;
  const p = POTENTIAL_IMPACT_POINTS[potential_impact] || 0;
  const t = THREAT_CONFIDENCE_POINTS[threat_confidence] || 0;
  return Math.min(100, Math.max(0, s + a + p + t));
}

function getRiskCategory(score) {
  if (score <= 30) return 'Low';
  if (score <= 60) return 'Medium';
  if (score <= 80) return 'High';
  return 'Critical';
}

function getRiskExplanation({ severity, asset_importance, potential_impact, threat_confidence }) {
  return `Severity (${severity}): ${SEVERITY_POINTS[severity] || 0} pts + ` +
    `Asset Importance (${asset_importance}): ${ASSET_IMPORTANCE_POINTS[asset_importance] || 0} pts + ` +
    `Potential Impact (${potential_impact}): ${POTENTIAL_IMPACT_POINTS[potential_impact] || 0} pts + ` +
    `Threat Confidence (${threat_confidence}): ${THREAT_CONFIDENCE_POINTS[threat_confidence] || 0} pts`;
}

module.exports = { calculateRiskScore, getRiskCategory, getRiskExplanation };
