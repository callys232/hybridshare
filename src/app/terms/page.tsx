import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service · Lamid FileShare' };

const LAST_UPDATED = 'May 27, 2026';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Lamid FileShare ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the Platform. These terms apply to all users, including learners, instructors, administrators, and visitors.`,
  },
  {
    title: '2. Use of the Platform',
    body: `You may use Lamid FileShare for lawful purposes only. You agree not to: (a) upload or transmit any content that is unlawful, harmful, defamatory, or infringing; (b) attempt to gain unauthorised access to any part of the Platform; (c) interfere with or disrupt the integrity or performance of the Platform; (d) collect or harvest user data without consent; or (e) use the Platform to distribute spam or unsolicited communications.`,
  },
  {
    title: '3. Accounts and Registration',
    body: `You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your credentials and for all activity that occurs under your account. You must notify us immediately at security@lamidgroup.com of any unauthorised use. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: '4. Course Content and Intellectual Property',
    body: `All course content, materials, videos, quizzes, and assessments on Lamid FileShare are protected by copyright and other intellectual property laws. Instructors retain ownership of their original content and grant Lamid FileShare a non-exclusive licence to host and deliver it. Learners are granted a personal, non-transferable licence to access enrolled course content for their own educational use only. Reproduction, redistribution, or commercial use of content is strictly prohibited.`,
  },
  {
    title: '5. Payments and Refunds',
    body: `Paid courses and subscriptions are processed securely through Stripe. Prices are displayed inclusive of applicable taxes. We offer a 30-day money-back guarantee on individual course purchases — contact support@lamidgroup.com within 30 days of purchase if you are unsatisfied. Subscription fees are billed in advance on a recurring basis. Cancellations take effect at the end of the current billing period. We reserve the right to change pricing with 30 days' notice.`,
  },
  {
    title: '6. Certificates',
    body: `Certificates of completion are issued upon successfully finishing a course's requirements, including all lessons and assessments. Certificates are for personal and professional verification purposes. Lamid FileShare does not guarantee that certificates will be recognised by any employer, institution, or regulatory body. We reserve the right to revoke certificates if fraud or academic dishonesty is discovered.`,
  },
  {
    title: '7. User-Generated Content',
    body: `Users may post reviews, forum threads, comments, and other content ("User Content"). You retain ownership of your User Content but grant Lamid FileShare a worldwide, royalty-free licence to use, display, and distribute it on the Platform. You are solely responsible for your User Content and confirm it does not violate any third-party rights or applicable laws. We may remove User Content that violates these terms without notice.`,
  },
  {
    title: '8. Privacy',
    body: `Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using Lamid FileShare, you consent to the collection and use of your information as described in the Privacy Policy.`,
  },
  {
    title: '9. Disclaimers and Limitation of Liability',
    body: `Lamid FileShare is provided "as is" without warranties of any kind, express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses. To the maximum extent permitted by law, Lamid FileShare shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, even if advised of the possibility of such damages.`,
  },
  {
    title: '10. Changes to Terms',
    body: `We reserve the right to modify these Terms at any time. Material changes will be notified via email or a prominent notice on the Platform at least 14 days before taking effect. Your continued use of the Platform after changes take effect constitutes acceptance of the revised Terms.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms are governed by and construed in accordance with the laws of the jurisdiction in which Lamid FileShare is incorporated, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts in that jurisdiction.`,
  },
  {
    title: '12. Contact',
    body: `For questions about these Terms, please contact us at legal@lamidgroup.com or write to: Lamid FileShare Legal, 123 Learning Lane, Tech City, TC 10001.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-white-off">
      {/* Header */}
      <header className="bg-white border-b border-brand-gray px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-brand-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-3 h-3 bg-brand-red rounded-sm" />
          </div>
          <span className="font-bold text-brand-black tracking-tight">Lamid FileShare</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-brand-gray-dark hover:text-brand-black transition-colors">
          Back to app →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-brand-black mb-2">Terms of Service</h1>
          <p className="text-sm text-brand-gray-dark">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-10 text-sm text-amber-800">
          <strong>Summary:</strong> Use the platform lawfully, respect intellectual property, pay for what you use, and treat others well. The full details are below.
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-base font-bold text-brand-black mb-2">{s.title}</h2>
              <p className="text-sm text-brand-gray-dark leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-brand-gray flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-xs text-brand-gray-dark">
            Questions? Email <a href="mailto:legal@lamidgroup.com" className="text-brand-red hover:underline">legal@lamidgroup.com</a>
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/privacy" className="text-brand-red hover:underline font-medium">Privacy Policy</Link>
            <Link href="/dashboard" className="text-brand-gray-dark hover:text-brand-black">Back to app</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
