// Real anomaly detection for energy readings — rolling mean + standard
// deviation (z-score). No placeholder numbers: every value is derived
// from the readings actually passed in.

/**
 * @param {Array<{kwh:number, cost:number, timestamp:number}>} readings - sorted oldest→newest
 * @returns {Array} readings annotated with isAnomaly, zScore, rollingMean
 */
export function detectEnergyAnomalies(readings, windowSize = 7) {
  if (!readings || readings.length === 0) return [];

  return readings.map((reading, idx) => {
    const windowStart = Math.max(0, idx - windowSize);
    const window = readings.slice(windowStart, idx); // prior readings only — no lookahead

    if (window.length < 3) {
      return { ...reading, isAnomaly: false, zScore: 0, rollingMean: reading.kwh };
    }

    const mean = window.reduce((sum, r) => sum + r.kwh, 0) / window.length;
    const variance = window.reduce((sum, r) => sum + Math.pow(r.kwh - mean, 2), 0) / window.length;
    const stdDev = Math.sqrt(variance);

    const zScore = stdDev === 0 ? 0 : (reading.kwh - mean) / stdDev;
    const isAnomaly = Math.abs(zScore) >= 2; // 2 std devs = statistically significant spike/drop

    return { ...reading, isAnomaly, zScore: Number(zScore.toFixed(2)), rollingMean: Number(mean.toFixed(2)) };
  });
}

/**
 * Aggregate summary stats used across the dashboard and in AI report generation.
 */
export function summarizeEnergy(readings) {
  if (!readings || readings.length === 0) {
    return { totalKwh: 0, totalCost: 0, avgKwh: 0, anomalyCount: 0, trend: 'flat' };
  }
  const annotated = detectEnergyAnomalies(readings);
  const totalKwh = readings.reduce((s, r) => s + r.kwh, 0);
  const totalCost = readings.reduce((s, r) => s + (r.cost || 0), 0);
  const avgKwh = totalKwh / readings.length;
  const anomalyCount = annotated.filter((r) => r.isAnomaly).length;

  const half = Math.floor(readings.length / 2);
  const firstHalfAvg = readings.slice(0, half).reduce((s, r) => s + r.kwh, 0) / (half || 1);
  const secondHalfAvg = readings.slice(half).reduce((s, r) => s + r.kwh, 0) / (readings.length - half || 1);
  const pctChange = firstHalfAvg === 0 ? 0 : ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  const trend = pctChange > 5 ? 'rising' : pctChange < -5 ? 'falling' : 'flat';

  return {
    totalKwh: Number(totalKwh.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    avgKwh: Number(avgKwh.toFixed(2)),
    anomalyCount,
    trend,
    pctChange: Number(pctChange.toFixed(1)),
  };
}
