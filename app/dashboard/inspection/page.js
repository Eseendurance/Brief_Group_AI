'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Eye, Upload, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/api-client';

const RISK_STYLES = {
  Low: 'text-emerald bg-emerald/10 border-emerald/30',
  Watch: 'text-cyan bg-cyan/10 border-cyan/30',
  Elevated: 'text-amber bg-amber/10 border-amber/30',
  Critical: 'text-alert bg-alert/10 border-alert/30',
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function InspectionPage() {
  const { user } = useAuth();
  const [assetLabel, setAssetLabel] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'inspections'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!file || !assetLabel) return;
    setUploading(true);
    setError('');
    try {
      // Real upload to Firebase Storage
      const storageRef = ref(storage, `inspections/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      // Real Claude vision analysis of the actual uploaded image
      const imageBase64 = await fileToBase64(file);
      const data = await authedFetch('/api/vision/analyze', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mediaType: file.type, assetLabel, imageUrl }),
      });
      setResult(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><Eye className="text-cyan" size={22} /> Computer Vision Inspection</h1>
        <p className="text-ink-300 text-sm mt-1">Upload a photo of equipment — Claude examines the actual image for visible fault indicators.</p>
      </div>

      <form onSubmit={handleAnalyze} className="card p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Asset label</label>
            <input required value={assetLabel} onChange={(e) => setAssetLabel(e.target.value)}
              className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none mb-4" placeholder="e.g. Panel B — East Wing" />

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl h-40 cursor-pointer hover:border-cyan/50 transition-colors">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {preview ? (
                // preview is a local blob URL created from the uploaded file — Image doesn't work with blob URLs here
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
              ) : (
                <>
                  <Upload className="text-ink-500" size={22} />
                  <span className="text-xs text-ink-500">Click to upload a photo</span>
                </>
              )}
            </label>
          </div>

          <div>
            <button type="submit" disabled={uploading || !file} className="w-full bg-cyan text-base-900 font-medium py-2.5 rounded-lg hover:bg-cyan-soft transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4">
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <Eye size={16} />}
              {uploading ? 'Analyzing…' : 'Run inspection'}
            </button>

            {error && (
              <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-sm rounded-lg p-3 mb-4">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {result && (
              <div className={clsx('rounded-xl border p-4', RISK_STYLES[result.riskLevel])}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{result.riskLevel} risk</span>
                  <span className="text-xs">Confidence: {result.confidence}</span>
                </div>
                <ul className="text-sm space-y-1 mb-2">
                  {result.findings?.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
                <p className="text-sm font-medium">{result.recommendation}</p>
              </div>
            )}
          </div>
        </div>
      </form>

      <h2 className="font-medium mb-3 text-ink-300">Inspection history</h2>
      {history.length === 0 ? (
        <div className="card p-6 text-center text-ink-500 text-sm">No inspections logged yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {history.map((h) => (
            <div key={h.id} className="card p-4 flex gap-3">
          {h.imageUrl && (
            <div className="relative w-16 h-16 rounded-lg shrink-0 overflow-hidden">
              <Image src={h.imageUrl} alt={h.assetLabel} fill className="object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{h.assetLabel}</div>
            <div className={clsx('inline-block text-xs px-2 py-0.5 rounded-full mt-1', RISK_STYLES[h.analysis?.riskLevel])}>
              {h.analysis?.riskLevel}
            </div>
          </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
