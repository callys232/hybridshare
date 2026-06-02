import Link from 'next/link';
import { CirclesPattern } from '@/components/ui/BackgroundPattern';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-black via-zinc-900 to-zinc-800 text-white">
      <CirclesPattern opacity={0.25} />

      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-red/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-28 lg:py-36 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Enterprise-grade hybrid file sharing
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight">
          Store. Share.{' '}
          <span className="text-brand-red">Connect.</span>
        </h1>

        <p className="text-zinc-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          The all-in-one file platform for teams that need secure storage, smart sharing, and seamless integrations — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-red text-white font-bold rounded-xl hover:bg-red-700 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-red/25 text-sm"
          >
            Start for free — no credit card
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-150 border border-white/20 text-sm"
          >
            See all features
          </Link>
        </div>

        <p className="mt-4 text-zinc-500 text-xs">
          Trusted by 50,000+ professionals across 180 countries
        </p>

        {/* Mock UI preview strip */}
        <div className="mt-14 mx-auto max-w-3xl">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <div className="flex-1 h-5 bg-white/10 rounded-md ml-2" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Q4 Brand Guidelines.pdf', size: '8.2 MB', color: 'bg-red-500/20 border-red-500/30' },
                { name: 'Product Roadmap.xlsx',    size: '2.0 MB', color: 'bg-emerald-500/20 border-emerald-500/30' },
                { name: 'Architecture v3.png',     size: '1.8 MB', color: 'bg-blue-500/20 border-blue-500/30' },
              ].map((f) => (
                <div key={f.name} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${f.color}`}>
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${f.color}`}>
                    <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-white/80 truncate">{f.name}</p>
                    <p className="text-[9px] text-zinc-500">{f.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
