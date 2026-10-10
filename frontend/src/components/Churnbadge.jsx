/**
 * ChurnBadge.jsx
 * 
 * Drop this file into your frontend/src/components/ folder.
 * 
 * Usage in your customer analytics table:
 * 
 *   import ChurnBadge from './components/ChurnBadge';
 * 
 *   // In your table row:
 *   <ChurnBadge
 *     probability={customer.churn_probability}
 *     predicted={customer.churn_predicted}
 *   />
 * 
 * Usage in customer detail page (full card):
 *   <ChurnBadge
 *     probability={customer.churn_probability}
 *     predicted={customer.churn_predicted}
 *     verdict={predictionResult?.verdict}
 *     confidence={predictionResult?.confidence}
 *     confidenceLabel={predictionResult?.confidence_label}
 *     riskLevel={predictionResult?.risk_level}
 *     showFull={true}
 *   />
 */

import React from 'react';

// ─── colour tokens ───────────────────────────────────────────────────────────
const COLORS = {
  High:   { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B', dot: '#EF4444' },
  Medium: { bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', dot: '#EAB308' },
  Low:    { bg: '#DCFCE7', border: '#86EFAC', text: '#166534', dot: '#22C55E' },
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function getRiskLevel(probability) {
  if (probability >= 60) return 'High';
  if (probability >= 25) return 'Medium';
  return 'Low';
}

function getVerdict(probability) {
  return probability >= 35 ? 'Will Churn' : 'Will Not Churn';
}

function getConfidence(probability) {
  const churn = probability >= 35;
  return churn
    ? { value: Math.round(probability * 10) / 10, label: probability >= 70 ? 'High' : probability >= 50 ? 'Medium' : 'Low' }
    : { value: Math.round((100 - probability) * 10) / 10, label: (100 - probability) >= 70 ? 'High' : (100 - probability) >= 50 ? 'Medium' : 'Low' };
}

// ─── compact badge (for table rows) ──────────────────────────────────────────
function CompactBadge({ probability }) {
  const risk       = getRiskLevel(probability);
  const verdict    = getVerdict(probability);
  const confidence = getConfidence(probability);
  const col        = COLORS[risk];
  const willChurn  = probability >= 35;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* probability + risk */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '2px 10px', borderRadius: 999,
        background: col.bg, border: '1px solid ' + col.border,
        color: col.text, fontSize: 13, fontWeight: 600,
        width: 'fit-content',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot }} />
        {probability.toFixed(1)}% {risk} Risk
      </span>

      {/* verdict + confidence */}
      <span style={{
        fontSize: 12, color: willChurn ? '#B91C1C' : '#15803D',
        fontWeight: 500,
      }}>
        {willChurn ? '⚠ ' : '✓ '}
        {verdict} · {confidence.value}% confidence
      </span>
    </div>
  );
}

// ─── full card (for detail page) ─────────────────────────────────────────────
function FullCard({ probability, verdict, confidence, confidenceLabel, riskLevel }) {
  // Derive locally if API data not yet available
  const risk     = riskLevel     || getRiskLevel(probability);
  const verd     = verdict       || getVerdict(probability);
  const conf     = confidence    != null ? confidence    : getConfidence(probability).value;
  const confLbl  = confidenceLabel || getConfidence(probability).label;
  const col      = COLORS[risk];
  const willChurn = verd === 'Will Churn';

  // Confidence bar
  const barColor = confLbl === 'High' ? '#22C55E' : confLbl === 'Medium' ? '#EAB308' : '#F97316';

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid ' + col.border,
      background: col.bg,
      padding: '20px 24px',
      maxWidth: 380,
    }}>
      {/* header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
            Churn Prediction
          </div>
          <div style={{
            fontSize: 28, fontWeight: 700,
            color: willChurn ? '#991B1B' : '#166534',
          }}>
            {probability.toFixed(1)}%
          </div>
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 999,
          background: col.border, color: col.text,
          fontSize: 13, fontWeight: 600,
        }}>
          {risk} Risk
        </span>
      </div>

      {/* verdict */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        borderRadius: 8,
        background: willChurn ? '#FEE2E2' : '#DCFCE7',
        border: '1px solid ' + (willChurn ? '#FCA5A5' : '#86EFAC'),
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>{willChurn ? '' : ''}</span>
        <div>
          <div style={{
            fontWeight: 700, fontSize: 15,
            color: willChurn ? '#991B1B' : '#166534',
          }}>
            {verd}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
            Model verdict based on customer behaviour
          </div>
        </div>
      </div>

      {/* confidence bar */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Confidence</span>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: barColor,
          }}>
            {conf}% ({confLbl})
          </span>
        </div>
        <div style={{
          height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: conf + '%',
            background: barColor, borderRadius: 4,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
          {willChurn
            ? 'Model is ' + conf + '% confident this customer will churn'
            : 'Model is ' + conf + '% confident this customer will NOT churn'}
        </div>
      </div>

      {/* factors list */}
      <div style={{ marginTop: 16, fontSize: 12, color: '#6B7280' }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>
          Key factors considered:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span>• Contract type (flexible = higher risk)</span>
          <span>• Monthly spend vs $80 threshold</span>
          <span>• Support call frequency</span>
          <span>• Satisfaction score &amp; complaints</span>
          <span>• Order engagement &amp; tenure</span>
        </div>
      </div>
    </div>
  );
}

// ─── exported component ───────────────────────────────────────────────────────
export default function ChurnBadge({
  probability = 0,
  predicted   = false,
  verdict,
  confidence,
  confidenceLabel,
  riskLevel,
  showFull    = false,
}) {
  const prob = typeof probability === 'number' ? probability : parseFloat(probability) || 0;

  if (showFull) {
    return (
      <FullCard
        probability={prob}
        verdict={verdict}
        confidence={confidence}
        confidenceLabel={confidenceLabel}
        riskLevel={riskLevel}
      />
    );
  }
  return <CompactBadge probability={prob} />;
}