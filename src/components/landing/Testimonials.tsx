const TESTIMONIALS = [
  {
    name: 'Amara Okonkwo',
    role: 'CTO, FinTech Africa',
    avatar: 'A',
    quote: 'HybridShare replaced three tools overnight. Our team now has one place for files, connectors, and secure sharing.',
  },
  {
    name: 'James Adeyemi',
    role: 'IT Director, Lamid Group',
    avatar: 'J',
    quote: 'The workspace permissions model is exactly what we needed. Granular access per team, zero complexity on our end.',
  },
  {
    name: 'Priya Nair',
    role: 'Engineering Manager, TechBridge',
    avatar: 'P',
    quote: 'We rolled HybridShare out to 200 employees in a day. The connector for our PostgreSQL database was set up in minutes.',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-brand-white-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Customer stories</span>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mt-2">
            Trusted by teams worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white border border-brand-gray rounded-2xl p-6 hover:border-brand-black hover:shadow-md transition-all duration-200"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill="#f59e0b">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-brand-gray-dark leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-brand-gray">
                <div className="w-9 h-9 rounded-full bg-brand-black text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm text-brand-black">{t.name}</p>
                  <p className="text-xs text-brand-gray-dark">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
