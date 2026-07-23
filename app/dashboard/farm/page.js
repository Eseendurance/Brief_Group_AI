'use client';

import { useState } from 'react';
import { Sprout, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { CROP_PROFILES, computeCropHealth } from '@/lib/farm-logic';

const STATUS_STYLES = {
  Healthy: 'text-emerald bg-emerald/10 border-emerald/30',
  Stressed: 'text-amber bg-amber/10 border-amber/30',
  'At Risk': 'text-alert bg-alert/10 border-alert/30',
};

export default function FarmPage() {
  const [crop, setCrop] = useState('maize');
  const [coords, setCoords] = useState({ lat: '9.0765', lon: '7.3986' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weather, setWeather] = useState(null);
  const [health, setHealth] = useState(null);

  async function runAnalysis(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Weather lookup failed');
      setWeather(data);
      setHealth(computeCropHealth(crop, {
        avgTempC: data.avgTempC,
        weeklyRainMm: data.weeklyRainMm,
        humidityPct: data.humidityPct,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><Sprout className="text-emerald" size={22} /> Smart Farm Prediction</h1>
        <p className="text-ink-300 text-sm mt-1">Live weather data scored against agronomic tolerance ranges for real crop-health signals.</p>
      </div>

      <form onSubmit={runAnalysis} className="card p-6 mb-6 grid sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Crop</label>
          <select value={crop} onChange={(e) => setCrop(e.target.value)}
            className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none">
            {Object.entries(CROP_PROFILES).map(([key, p]) => <option key={key} value={key}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Latitude</label>
          <input value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: e.target.value })}
            className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" />
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Longitude</label>
          <input value={coords.lon} onChange={(e) => setCoords({ ...coords, lon: e.target.value })}
            className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" />
        </div>
        <button type="submit" disabled={loading} className="bg-amber text-base-900 font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
          {loading ? 'Fetching…' : 'Run analysis'}
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-sm rounded-lg p-4 mb-6">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {health && weather && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-medium mb-4">Live weather ({weather.provider})</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-mono text-xl text-amber mono-num">{weather.avgTempC}°C</div>
                <div className="text-xs text-ink-500 mt-1">Avg temp (7d)</div>
              </div>
              <div>
                <div className="font-mono text-xl text-cyan mono-num">{weather.weeklyRainMm}mm</div>
                <div className="text-xs text-ink-500 mt-1">Rainfall (7d)</div>
              </div>
              <div>
                <div className="font-mono text-xl text-emerald mono-num">{weather.humidityPct}%</div>
                <div className="text-xs text-ink-500 mt-1">Humidity</div>
              </div>
            </div>
          </div>

          <div className={clsx('card p-6 border', STATUS_STYLES[health.status])}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{health.crop} — {health.status}</h3>
              <span className="font-mono text-2xl mono-num">{health.overallScore}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-300">Temperature fit</span><span className="mono-num">{health.tempScore}/100</span></div>
              <div className="flex justify-between"><span className="text-ink-300">Rainfall fit</span><span className="mono-num">{health.rainScore}/100</span></div>
              <div className="flex justify-between"><span className="text-ink-300">Fungal disease risk</span><span>{health.fungalRisk}</span></div>
            </div>
          </div>
        </div>
      )}

      {!health && !loading && (
        <div className="card p-10 text-center text-ink-500 text-sm">
          Select a crop and location, then run the analysis to pull live weather and score conditions.
        </div>
      )}
    </div>
  );
}
