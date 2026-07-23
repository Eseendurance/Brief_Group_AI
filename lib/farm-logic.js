// Real crop-health / yield-risk scoring derived from actual weather data
// pulled from the /api/weather route. Crop profiles use published
// agronomic tolerance ranges (FAO-style optimal ranges), not arbitrary numbers.

export const CROP_PROFILES = {
  maize: { tempRange: [18, 32], idealTemp: 25, rainWeeklyMm: [20, 60], name: 'Maize' },
  cassava: { tempRange: [20, 35], idealTemp: 28, rainWeeklyMm: [15, 70], name: 'Cassava' },
  rice: { tempRange: [20, 35], idealTemp: 27, rainWeeklyMm: [40, 100], name: 'Rice (lowland)' },
  tomato: { tempRange: [15, 30], idealTemp: 22, rainWeeklyMm: [15, 40], name: 'Tomato' },
  yam: { tempRange: [20, 33], idealTemp: 27, rainWeeklyMm: [25, 65], name: 'Yam' },
};

/**
 * @param {string} cropKey
 * @param {{avgTempC:number, weeklyRainMm:number, humidityPct:number}} weekly - derived from live weather API
 */
export function computeCropHealth(cropKey, weekly) {
  const profile = CROP_PROFILES[cropKey] || CROP_PROFILES.maize;
  const { avgTempC, weeklyRainMm, humidityPct } = weekly;

  // Temperature score: 100 at ideal, decaying toward edges of tolerance range, 0 outside it.
  const [tMin, tMax] = profile.tempRange;
  let tempScore;
  if (avgTempC < tMin || avgTempC > tMax) {
    tempScore = 0;
  } else {
    const distFromIdeal = Math.abs(avgTempC - profile.idealTemp);
    const maxDist = Math.max(profile.idealTemp - tMin, tMax - profile.idealTemp);
    tempScore = 100 * (1 - distFromIdeal / maxDist);
  }

  // Rainfall score: 100 within ideal weekly band, penalized proportionally outside it.
  const [rMin, rMax] = profile.rainWeeklyMm;
  let rainScore;
  if (weeklyRainMm >= rMin && weeklyRainMm <= rMax) {
    rainScore = 100;
  } else if (weeklyRainMm < rMin) {
    rainScore = Math.max(0, 100 * (weeklyRainMm / rMin));
  } else {
    const excess = weeklyRainMm - rMax;
    rainScore = Math.max(0, 100 - excess * 1.5); // waterlogging risk penalty
  }

  // Humidity is a secondary fungal-risk signal: very high humidity + high rain = disease pressure.
  const fungalRisk = humidityPct > 80 && weeklyRainMm > rMax ? 'Elevated' : humidityPct > 85 ? 'Watch' : 'Low';

  const overall = Math.round(tempScore * 0.5 + rainScore * 0.5);

  let status = 'Healthy';
  if (overall < 40) status = 'At Risk';
  else if (overall < 70) status = 'Stressed';

  return {
    crop: profile.name,
    overallScore: overall,
    status,
    tempScore: Math.round(tempScore),
    rainScore: Math.round(rainScore),
    fungalRisk,
    inputs: { avgTempC, weeklyRainMm, humidityPct },
  };
}
