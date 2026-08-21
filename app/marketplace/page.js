export default function Marketplace() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-semibold mb-6">Marketplace</h1>
      <p className="text-ink-500">Our marketplace connects vetted vendors with operators. This feature will expand during pilot and post-pilot phases.</p>
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="card p-4">
          <h4 className="font-medium">Inspection Cameras</h4>
          <p className="text-ink-500 text-sm">High-quality cameras for remote inspections.</p>
        </div>
        <div className="card p-4">
          <h4 className="font-medium">Replacement Parts</h4>
          <p className="text-ink-500 text-sm">Spare parts and consumables for field equipment.</p>
        </div>
        <div className="card p-4">
          <h4 className="font-medium">Services</h4>
          <p className="text-ink-500 text-sm">Third-party maintenance and inspection services.</p>
        </div>
      </div>
    </main>
  );
}
