import { LinesPattern } from '@/component/ui/BackgroundPattern';

const STEPS = [
  {
    number: '01',
    title: 'Create your workspace',
    desc: 'Sign up in under 60 seconds. Create a workspace for your team, project, or department — personalised with a name, colour, and storage quota.',
    detail: ['No credit card required on free plan', 'Invite team members by email', 'Choose a workspace type: Team, Project, or Department'],
    color: 'bg-blue-50 border-blue-200 text-blue-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Upload files or connect sources',
    desc: 'Drag and drop files directly, or connect to external sources like Google Drive, OneDrive, Dropbox, S3, or your database — all synced automatically.',
    detail: ['Drag-and-drop upload with progress tracking', '23+ connector integrations available', 'Scheduled sync keeps everything up to date'],
    color: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Share with anyone',
    desc: 'Generate a secure link in seconds. Set a password, expiry date, and download limit — then share with teammates, clients, or the public.',
    detail: ['Password-protected links', 'Set link expiry and download caps', 'Track every view with geo and device data'],
    color: 'bg-amber-50 border-amber-200 text-amber-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Manage, audit and report',
    desc: 'Control who sees what with role-based permissions. Monitor activity with real-time audit logs, storage analytics, and access reports exportable to CSV.',
    detail: ['Fine-grained roles: Owner, Admin, Editor, Viewer', 'Full audit trail with IP and timestamp', 'Export reports for compliance reviews'],
    color: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-brand-gray-dark">
      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      {text}
    </li>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="relative py-24 bg-brand-white-soft overflow-hidden">
      <LinesPattern opacity={0.5} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-brand-red uppercase tracking-widest">How it works</span>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mt-2 mb-3">
            Up and running in minutes
          </h2>
          <p className="text-brand-gray-dark text-lg max-w-xl mx-auto">
            No complex setup. No migration scripts. Four steps from sign-up to a fully working file platform.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
          {STEPS.map((step, i) => (
            <div key={step.number}
              className="relative bg-white border border-brand-gray rounded-2xl p-6 hover:border-brand-black hover:shadow-md transition-all duration-200 group">

              {/* Connector line (desktop, vertical pairs) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute -bottom-3 left-1/2 w-px h-6 bg-brand-gray -translate-x-1/2 z-10" />
              )}

              <div className="flex items-start gap-4">
                {/* Icon + number */}
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-200 group-hover:scale-105 ${step.color}`}>
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-black text-brand-gray-dark tracking-widest">{step.number}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-brand-black mb-1.5 group-hover:text-brand-red transition-colors duration-150">
                    {step.title}
                  </h3>
                  <p className="text-sm text-brand-gray-dark leading-relaxed mb-3">{step.desc}</p>
                  <ul className="space-y-1.5">
                    {step.detail.map((d) => <CheckItem key={d} text={d} />)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-14 text-center">
          <p className="text-sm text-brand-gray-dark mb-4">
            Average setup time from sign-up to first shared file:{' '}
            <span className="font-bold text-brand-black">under 3 minutes.</span>
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-700 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm"
          >
            Get started free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
