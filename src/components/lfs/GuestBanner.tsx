import Link from 'next/link';

export function GuestBanner() {
  return (
    <div className="bg-brand-black text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
      <p className="text-zinc-300 text-xs sm:text-sm">
        You're browsing as a guest. <span className="text-white font-semibold">Sign in</span> to upload files, play videos, and collaborate.
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/login" className="text-xs font-semibold px-3 py-1.5 border border-white/30 rounded-lg hover:bg-white/10 transition-colors">
          Log in
        </Link>
        <Link href="/register" className="text-xs font-bold px-3 py-1.5 bg-brand-red rounded-lg hover:bg-red-700 transition-colors">
          Sign up free
        </Link>
      </div>
    </div>
  );
}
