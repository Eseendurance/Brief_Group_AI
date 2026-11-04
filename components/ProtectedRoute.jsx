'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { authedFetch } from '@/lib/api-client';

// Real route protection: redirects to /login if there is no authenticated
// Firebase user. This is enforced client-side here for UX, and again
// server-side in every API route via verifyRequestUser() — the API routes
// are the actual security boundary, this is just the redirect.
export default function ProtectedRoute({ children }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const [workspace, setWorkspace] = useState({ uid: null, status: 'checking', error: '' });

  useEffect(() => {
    if (!loading && configured && !user) {
      router.push('/login');
    }
  }, [user, loading, configured, router]);

  useEffect(() => {
    if (loading || !configured || !user) return;
    let active = true;
    authedFetch('/api/companies')
      .then((data) => {
        if (!active) return;
        if (!data.company) {
          router.replace('/onboarding');
          return;
        }
        setWorkspace({ uid: user.uid, status: 'ready', error: '' });
      })
      .catch((error) => {
        if (active) setWorkspace({ uid: user.uid, status: 'error', error: error.message });
      });
    return () => {
      active = false;
    };
  }, [user, loading, configured, router]);

  if (!configured) {
    return (
      <div className="min-h-screen bg-base-900 flex items-center justify-center px-6">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="text-alert mx-auto mb-3" size={28} />
          <h2 className="font-display font-medium text-lg mb-2">Firebase isn't configured yet</h2>
          <p className="text-ink-300 text-sm">
            Add your Firebase project keys to <code className="text-amber">.env.local</code> (see README.md) to enable accounts and the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber" size={28} />
      </div>
    );
  }

  if (!user) return null; // redirect in-flight
  if (workspace.uid !== user.uid || workspace.status === 'checking') {
    return (
      <div className="min-h-screen bg-base-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber" size={28} />
      </div>
    );
  }
  if (workspace.status === 'error') {
    return (
      <div className="min-h-screen bg-base-900 flex items-center justify-center px-6">
        <div role="alert" className="card max-w-md p-8 text-center">
          <AlertCircle className="text-alert mx-auto mb-3" size={28} />
          <h2 className="font-display font-medium text-lg mb-2">Workspace access could not be verified</h2>
          <p className="text-ink-300 text-sm">{workspace.error}</p>
        </div>
      </div>
    );
  }

  return children;
}
