import Link from 'next/link';

const SOCIALS = [
  {
    label: 'Twitter / X',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.261 5.636zm-.745 17.5h1.833l-11.45-15.28H5.945z',
  },
  {
    label: 'LinkedIn',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
];

export function FooterBrand() {
  return (
    <div className="md:col-span-1 flex flex-col gap-6">
      <div>
        <Link href="/" className="flex items-center gap-2.5 group mb-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-150 group-hover:scale-105">
            <div className="w-3.5 h-3.5 bg-brand-red rounded-sm" />
          </div>
          <span className="text-white font-black text-lg tracking-tight">HybridShare</span>
        </Link>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-[220px]">
          Enterprise hybrid file sharing — manage, share and connect your data from a single platform.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {SOCIALS.map(({ label, path }) => (
          <a
            key={label}
            href="#"
            aria-label={label}
            className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d={path} />
            </svg>
          </a>
        ))}
      </div>

      <div className="inline-flex items-center gap-2 border border-zinc-800 rounded-lg px-3 py-2 w-fit">
        <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-[11px] text-zinc-500 font-medium">SOC 2 Type II Certified</span>
      </div>
    </div>
  );
}
