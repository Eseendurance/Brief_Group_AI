import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import TrialBanner from '@/components/TrialBanner';

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-base-900">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <TrialBanner />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
