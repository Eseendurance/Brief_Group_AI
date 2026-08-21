export default function Features() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-semibold mb-6">Features</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-medium mb-2">AI Fault Detection</h3>
          <p className="text-ink-500 text-sm">Proactive fault scoring across equipment and lines.</p>
        </div>
        <div className="card p-6">
          <h3 className="font-medium mb-2">Computer Vision Inspection</h3>
          <p className="text-ink-500 text-sm">Upload photos for remote AI inspection.</p>
        </div>
        <div className="card p-6">
          <h3 className="font-medium mb-2">Digital Marketplace</h3>
          <p className="text-ink-500 text-sm">Trusted sourcing for spare parts and services.</p>
        </div>
      </div>
    </main>
  );
}
