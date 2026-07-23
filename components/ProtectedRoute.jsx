'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, AlertCircle } from 'lucide-react';

// Real route protection: redirects to /login if there is no authenticated
// Firebase user. This is enforced client-side here for UX, and again
// server-side in every API route via verifyRequestUser() — the API routes
// are the actual security boundary, this is just the redirect.
export default function ProtectedRoute({ children }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && configured && !user) {
      router.push('/login');
    }
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

  return children;
}
