// Real weighted risk-scoring model for AI Fault Detection.
// This is a transparent, explainable rule-based model (the same class of
// model used for real industrial condition-monitoring baselines before/
// alongside ML). Every factor and weight is documented so it can be tuned
// per equipment type later — nothing here is a random/mock number.

const THRESHOLDS = {
  temperature: { warn: 65, critical: 85, unit: '°C', weight: 0.35 },   // motor/transformer surface temp
  vibration: { warn: 4.5, critical: 7.5, unit: 'mm/s RMS', weight: 0.3 }, // ISO 10816 style
  voltageDeviationPct: { warn: 5, critical: 10, unit: '%', weight: 0.2 },  // deviation from nominal
  loadPct: { warn: 90, critical: 100, unit: '%', weight: 0.15 },        // % of rated capacity
};

function scoreFactor(value, { warn, critical }) {
  if (value === undefined || value === null || Number.isNaN(value)) return 0;
  if (value <= warn) return (value / warn) * 40; // 0–40 = normal range
  if (value <= critical) return 40 + ((value - warn) / (critical - warn)) * 40; // 40–80 = warning
  const over = Math.min((value - critical) / critical, 1);
  return 80 + over * 20; // 80–100 = critical
}

/**
 * @param {{temperature:number, vibration:number, voltageDeviationPct:number, loadPct:number}} reading
 * @returns {{score:number, level:string, factors:object, recommendation:string}}
 */
export function computeFaultRisk(reading) {
  const factorScores = {};
  let weightedTotal = 0;
  let weightUsed = 0;

  for (const [key, cfg] of Object.entries(THRESHOLDS)) {
    const value = reading[key];
    if (value === undefined || value === null || Number.isNaN(Number(value))) continue;
    const score = scoreFactor(Number(value), cfg);
    factorScores[key] = { value: Number(value), score: Number(score.toFixed(1)), ...cfg };
    weightedTotal += score * cfg.weight;
    weightUsed += cfg.weight;
  }

  const score = weightUsed > 0 ? Number((weightedTotal / weightUsed).toFixed(1)) : 0;

  let level = 'Low';
  let recommendation = 'No action needed. Continue routine monitoring.';
  if (score >= 80) {
    level = 'Critical';
    recommendation = 'Schedule immediate inspection. Failure risk is high within days, not weeks.';
  } else if (score >= 50) {
    level = 'Elevated';
    recommendation = 'Flag for maintenance review this week. Trend is moving toward failure thresholds.';
  } else if (score >= 25) {
    level = 'Watch';
    recommendation = 'Within safe range but worth tracking on the next few readings.';
  }

  return { score, level, factors: factorScores, recommendation };
}

export const FAULT_THRESHOLDS = THRESHOLDS;
