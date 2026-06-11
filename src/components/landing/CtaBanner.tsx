import Link from 'next/link';

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden py-20 bg-brand-red">
      {/* Subtle ring decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Ready to exchange files securely with your clients?
        </h2>
        <p className="text-red-100 text-lg mb-8 leading-relaxed">
          Purpose-built for consultants and advisors who handle critical data. Set up in under 2 minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-brand-red font-bold rounded-xl hover:bg-zinc-100 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] text-sm shadow-lg"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-transparent text-white font-semibold rounded-xl border border-white/40 hover:bg-white/10 transition-all duration-150 text-sm"
          >
            Sign in to existing account
          </Link>
        </div>
        <p className="mt-5 text-red-200/70 text-xs">
          Enterprise? Contact us at{' '}
          <a href="mailto:enterprise@lamidgroup.com" className="underline hover:text-white transition-colors">
            enterprise@lamidgroup.com
          </a>
        </p>
      </div>
    </section>
  );
}
