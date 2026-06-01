import Link from 'next/link';

const FOOTER_LINKS = {
  Product: [
    { href: '#features',    label: 'Features'    },
    { href: '#pricing',     label: 'Pricing'     },
    { href: '/upgrade',     label: 'Plans'       },
    { href: '/register',    label: 'Get started' },
  ],
  Platform: [
    { href: '/files',       label: 'File Manager'  },
    { href: '/workspaces',  label: 'Workspaces'    },
    { href: '/connectors',  label: 'Connectors'    },
    { href: '/shared',      label: 'Shared Links'  },
  ],
  Company: [
    { href: '/privacy',     label: 'Privacy Policy' },
    { href: '/terms',       label: 'Terms of Service'},
    { href: '/admin/login', label: 'Admin portal'   },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110">
                <div className="w-3 h-3 bg-brand-red rounded-sm" />
              </div>
              <span className="text-white font-black tracking-tight">HybridShare</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Enterprise hybrid file sharing — manage, share and connect your data from a single platform.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { label: 'Twitter / X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.261 5.636zm-.745 17.5h1.833l-11.45-15.28H5.945z' },
                { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
              ].map(({ label, path }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors duration-150">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4">{group}</p>
              <ul className="space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href}
                      className="text-sm text-zinc-500 hover:text-white transition-colors duration-150">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} HybridShare by Lamid. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
