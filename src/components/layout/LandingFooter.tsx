import { FooterBrand } from './footer/FooterBrand';
import { FooterLinkGroup } from './footer/FooterLinkGroup';
import { FooterBottomBar } from './footer/FooterBottomBar';

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
    { href: '/privacy',     label: 'Privacy Policy'   },
    { href: '/terms',       label: 'Terms of Service' },
    { href: '/admin/login', label: 'Admin portal'     },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800/50">
      {/* Newsletter strip */}
      <div className="border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">Stay in the loop</p>
            <p className="text-zinc-500 text-xs mt-0.5">Product updates and announcements — no spam.</p>
          </div>
          <form className="flex gap-2 w-full sm:w-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 sm:w-56 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors duration-150 whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <FooterBrand />
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <FooterLinkGroup key={group} title={group} links={links} />
          ))}
        </div>

        <FooterBottomBar />
      </div>
    </footer>
  );
}
