'use client';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Brief Group" width={36} height={36} className="h-9 w-9 object-contain" />
          <Link href="/" className="font-display font-semibold text-lg tracking-tight">Brief Group</Link>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-ink-500">
          <Link href="/about" className="hover:text-ink-100 transition-colors">About</Link>
          <Link href="/features" className="hover:text-ink-100 transition-colors">Features</Link>
          <Link href="/marketplace" className="hover:text-ink-100 transition-colors">Marketplace</Link>
          <Link href="/pricing" className="hover:text-ink-100 transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-ink-100 transition-colors">Contact</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-ink-500 hover:text-ink-100 hidden sm:block">Log in</Link>
          <Link href="/signup" className="text-sm font-medium bg-amber text-base-900 px-4 py-2 rounded-lg hover:bg-amber-soft transition-colors">Apply</Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
