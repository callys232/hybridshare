import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-white-off dark:bg-dark-surface flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-brand-black dark:bg-white rounded-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-brand-red rounded-sm" />
          </div>
          <span className="font-bold text-xl text-brand-black dark:text-dark-text tracking-tight">HybridShare</span>
        </Link>

        <p className="text-8xl font-black text-brand-black dark:text-dark-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-brand-black dark:text-dark-text mb-2">Page not found</h1>
        <p className="text-brand-gray-dark dark:text-dark-text-muted text-sm mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-2.5 bg-brand-black dark:bg-white text-white dark:text-brand-black text-sm font-semibold rounded-button hover:bg-brand-red dark:hover:bg-brand-gray transition-colors">
            Go to Dashboard
          </Link>
          <Link href="/files" className="px-6 py-2.5 border border-brand-gray dark:border-dark-border text-brand-black dark:text-dark-text text-sm font-medium rounded-button hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors">
            Browse Files
          </Link>
        </div>
      </div>
    </div>
  );
}
