export function FooterBottomBar() {
  return (
    <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Lamid FileShare by Lamid Group. All rights reserved.
      </p>
      <div className="flex items-center gap-5 text-xs text-zinc-600">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          All systems operational
        </div>
        <span className="text-zinc-800">|</span>
        <span>v2.4.1</span>
      </div>
    </div>
  );
}
