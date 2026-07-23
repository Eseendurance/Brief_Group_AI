import { NextResponse } from 'next/server';

// Live weather + 7-day forecast for the Farm Prediction module.
// Default provider: Open-Meteo — free, no API key required, real live data.
// If OPENWEATHER_API_KEY is set and WEATHER_PROVIDER=openweather, that's used instead.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '9.0765'; // default: Abuja, Nigeria
  const lon = searchParams.get('lon') || '7.3986';

  const provider = process.env.WEATHER_PROVIDER || 'open-meteo';

  try {
    if (provider === 'openweather' && process.env.OPENWEATHER_API_KEY) {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenWeather error: ${res.status}`);
      const data = await res.json();

      const temps = data.list.slice(0, 8).map((d) => d.main.temp);
      const humidity = data.list.slice(0, 8).map((d) => d.main.humidity);
      const rainMm = data.list.slice(0, 8).reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0);

      return NextResponse.json({
        provider: 'openweather',
        location: data.city?.name || 'Unknown',
        avgTempC: Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)),
        humidityPct: Number((humidity.reduce((a, b) => a + b, 0) / humidity.length).toFixed(0)),
        weeklyRainMm: Number((rainMm * 7).toFixed(1)), // extrapolate 24h sample to weekly
        raw: data.list.slice(0, 8),
      });
    }

    // Default: Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const data = await res.json();

    const maxTemps = data.daily.temperature_2m_max;
    const minTemps = data.daily.temperature_2m_min;
    const avgTempC =
      maxTemps.reduce((a, b, i) => a + (b + minTemps[i]) / 2, 0) / maxTemps.length;
    const weeklyRainMm = data.daily.precipitation_sum.reduce((a, b) => a + b, 0);
    const humidityValues = data.daily.relative_humidity_2m_mean || [];
    const humidityPct = humidityValues.length
      ? humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length
      : 70;

    return NextResponse.json({
      provider: 'open-meteo',
      location: `${lat}, ${lon}`,
      avgTempC: Number(avgTempC.toFixed(1)),
      humidityPct: Number(humidityPct.toFixed(0)),
      weeklyRainMm: Number(weeklyRainMm.toFixed(1)),
      daily: data.daily,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Weather fetch failed' }, { status: 502 });
  }
}
