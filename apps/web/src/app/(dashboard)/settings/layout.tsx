import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { LinesPattern } from '@/components/ui/BackgroundPattern';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-auto bg-brand-white-off dark:bg-dark-bg">
      <LinesPattern opacity={0.5} />
      <div className="relative z-10 max-w-5xl mx-auto w-full px-6 py-8 flex gap-10">
        <SettingsSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
