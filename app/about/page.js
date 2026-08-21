import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-4">About Brief Group</h1>
          <p className="text-ink-500 mb-4">Brief Group builds AI infrastructure intelligence for industrial operations — combining energy monitoring, automated reporting, computer vision inspection, and a digital marketplace for equipment and services.</p>
          <p className="text-ink-500">We partner with operators to deliver pilot projects and practical outcomes: lower downtime, improved forecasting, and faster procurement cycles through our marketplace.</p>
        </div>
        <div>
          <div className="w-full h-64 bg-surface border border-border rounded-lg overflow-hidden">
            <img src="https://images.unsplash.com/photo-1581091870620-1f1f3c7f6c2b?q=80&w=1200&auto=format&fit=crop" alt="Control room" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </main>
  );
}
