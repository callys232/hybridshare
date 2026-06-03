import Link from 'next/link';

interface FooterLinkGroupProps {
  title: string;
  links: { href: string; label: string }[];
}

export function FooterLinkGroup({ title, links }: FooterLinkGroupProps) {
  return (
    <div>
      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5">{title}</p>
      <ul className="space-y-3">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm text-zinc-500 hover:text-white transition-colors duration-150"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
