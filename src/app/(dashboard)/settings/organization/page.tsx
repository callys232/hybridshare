'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useOrganizationStore } from '@/store/organization.store';

const ORG_TABS = ['General', 'Members', 'SSO', 'Branding', 'Webhooks'] as const;
type OrgTab = (typeof ORG_TABS)[number];

const WEBHOOK_EVENTS = [
  { value: 'enrollment.created', label: 'Enrollment created' },
  { value: 'enrollment.completed', label: 'Course completed' },
  { value: 'quiz.passed', label: 'Quiz passed' },
  { value: 'certificate.issued', label: 'Certificate issued' },
  { value: 'user.created', label: 'User registered' },
  { value: 'payment.succeeded', label: 'Payment succeeded' },
  { value: 'payment.failed', label: 'Payment failed' },
  { value: 'live_session.started', label: 'Live session started' },
];

const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    OWNER: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    ADMIN: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
    MEMBER: 'text-brand-black dark:text-dark-text bg-brand-white-soft dark:bg-dark-surface-2 border-brand-gray dark:border-dark-border',
    VIEWER: 'text-brand-gray-dark dark:text-dark-text-muted bg-white dark:bg-dark-surface-1 border-brand-gray dark:border-dark-border',
  };
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', colors[role] ?? colors.MEMBER)}>
      {role}
    </span>
  );
}

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<OrgTab>('General');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    organization, members, ssoConfig, whiteLabel, webhooks,
    fetchOrganization, fetchMembers, fetchSSO, fetchWhiteLabel, fetchWebhooks,
    updateOrganization, inviteMember, removeMember, updateMemberRole,
    upsertSSO, upsertWhiteLabel, createWebhook, deleteWebhook,
  } = useOrganizationStore();

  const [orgForm, setOrgForm] = useState({ name: '', domain: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [ssoForm, setSsoForm] = useState({ provider: 'SAML', isEnabled: false, metadataUrl: '', clientId: '', domain: '' });
  const [brandingForm, setBrandingForm] = useState({ primaryColor: '#c12129', customDomain: '', emailFromName: '' });
  const [webhookForm, setWebhookForm] = useState({ url: '', events: [] as string[] });
  const [showWebhookForm, setShowWebhookForm] = useState(false);

  useEffect(() => {
    fetchOrganization();
    fetchMembers();
    fetchWebhooks();
  }, [fetchOrganization, fetchMembers, fetchWebhooks]);

  useEffect(() => {
    if (organization) {
      setOrgForm({ name: organization.name, domain: organization.domain ?? '' });
    }
  }, [organization]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    if (activeTab === 'General') await updateOrganization(orgForm).catch(() => {});
    if (activeTab === 'SSO') await upsertSSO(ssoForm).catch(() => {});
    if (activeTab === 'Branding') await upsertWhiteLabel(brandingForm).catch(() => {});
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    await inviteMember(inviteEmail, inviteRole);
    setInviteEmail('');
  };

  const handleAddWebhook = async () => {
    if (!webhookForm.url || webhookForm.events.length === 0) return;
    await createWebhook(webhookForm);
    setWebhookForm({ url: '', events: [] });
    setShowWebhookForm(false);
  };

  const toggleWebhookEvent = (event: string) => {
    setWebhookForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Organization</h1>
        <p className="text-brand-gray-dark dark:text-dark-text-muted text-sm mt-1">Manage your team, integrations, and enterprise settings</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-gray dark:border-dark-border mb-8 gap-0 overflow-x-auto">
        {ORG_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-150',
              activeTab === tab ? 'border-brand-red text-white' : 'border-transparent text-brand-gray-dark dark:text-dark-text-muted hover:text-brand-black dark:text-dark-text hover:border-brand-gray dark:border-dark-border'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === 'General' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Organization Name</label>
            <input
              type="text"
              value={orgForm.name}
              onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Primary Domain</label>
            <input
              type="text"
              value={orgForm.domain}
              onChange={(e) => setOrgForm((f) => ({ ...f, domain: e.target.value }))}
              placeholder="example.com"
              className="w-full bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
            />
            <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-1">Used to auto-assign new users to your organization</p>
          </div>
          <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl p-4">
            <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted">
              <span className="text-white font-semibold">Plan: </span>{organization?.plan ?? 'FREE'} ·
              <span className="text-white font-semibold"> Members: </span>{organization?.memberCount ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Members */}
      {activeTab === 'Members' && (
        <div className="space-y-5">
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-brand-gray-dark dark:text-dark-text-muted focus:outline-none focus:border-brand-red transition-colors"
            />
            <select
              aria-label="Invite role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
            >
              {['ADMIN', 'MEMBER', 'VIEWER'].map((r) => <option key={r}>{r}</option>)}
            </select>
            <button
              type="button"
              onClick={handleInvite}
              className="px-4 py-2.5 bg-brand-red text-white text-sm rounded-lg hover:bg-red-700 transition-all hover:scale-[1.02] font-semibold"
            >
              Invite
            </button>
          </div>

          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl hover:border-brand-gray dark:border-dark-border transition-all duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-red/20 flex items-center justify-center text-sm font-bold text-brand-red">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={member.role} />
                  {member.role !== 'OWNER' && (
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="text-zinc-600 hover:text-brand-red transition-colors p-1 rounded hover:bg-brand-white-soft dark:bg-dark-surface-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SSO */}
      {activeTab === 'SSO' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl">
            <div>
              <p className="text-sm font-semibold text-white">Enable Single Sign-On</p>
              <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-0.5">Allow members to log in with your identity provider</p>
            </div>
            <button
              type="button"
              onClick={() => setSsoForm((f) => ({ ...f, isEnabled: !f.isEnabled }))}
              className={cn(
                'relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors duration-200',
                ssoForm.isEnabled ? 'bg-brand-red' : 'bg-brand-gray dark:bg-dark-surface-3'
              )}
            >
              <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200', ssoForm.isEnabled ? 'translate-x-4' : 'translate-x-0')} />
            </button>
          </div>

          {ssoForm.isEnabled && (
            <>
              <div>
                <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Provider</label>
                <div className="flex gap-2">
                  {['SAML', 'OIDC', 'LDAP'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSsoForm((f) => ({ ...f, provider: p }))}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150',
                        ssoForm.provider === p ? 'bg-brand-red text-white border-brand-red' : 'bg-white dark:bg-dark-surface-1 text-brand-gray-dark dark:text-dark-text-muted border-brand-gray dark:border-dark-border hover:border-zinc-600 hover:text-white'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {ssoForm.provider === 'SAML' && (
                <div>
                  <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Identity Provider Metadata URL</label>
                  <input
                    type="url"
                    value={ssoForm.metadataUrl}
                    onChange={(e) => setSsoForm((f) => ({ ...f, metadataUrl: e.target.value }))}
                    placeholder="https://idp.example.com/saml/metadata"
                    className="w-full bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-brand-gray-dark dark:text-dark-text-muted focus:outline-none focus:border-brand-red transition-colors"
                  />
                </div>
              )}

              {(ssoForm.provider === 'OIDC') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Client ID</label>
                    <input
                      type="text"
                      value={ssoForm.clientId}
                      onChange={(e) => setSsoForm((f) => ({ ...f, clientId: e.target.value }))}
                      className="w-full bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Allowed Domain</label>
                <input
                  type="text"
                  value={ssoForm.domain}
                  onChange={(e) => setSsoForm((f) => ({ ...f, domain: e.target.value }))}
                  placeholder="company.com"
                  className="w-full bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-brand-gray-dark dark:text-dark-text-muted focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Branding */}
      {activeTab === 'Branding' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-dark-surface-1 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400">
            White-labeling is available on the Enterprise plan.
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingForm.primaryColor}
                onChange={(e) => setBrandingForm((f) => ({ ...f, primaryColor: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={brandingForm.primaryColor}
                onChange={(e) => setBrandingForm((f) => ({ ...f, primaryColor: e.target.value }))}
                className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-red transition-colors w-32"
              />
            </div>
          </div>
          {[
            { key: 'customDomain', label: 'Custom Domain', placeholder: 'learn.yourcompany.com' },
            { key: 'emailFromName', label: 'Email From Name', placeholder: 'YourCompany Learning' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">{label}</label>
              <input
                type="text"
                value={brandingForm[key as keyof typeof brandingForm]}
                onChange={(e) => setBrandingForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-brand-gray-dark dark:text-dark-text-muted focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {/* Webhooks */}
      {activeTab === 'Webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted">{webhooks.length} endpoint{webhooks.length !== 1 ? 's' : ''} configured</p>
            <button
              type="button"
              onClick={() => setShowWebhookForm(!showWebhookForm)}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-red text-white text-xs rounded-lg hover:bg-red-700 transition-all hover:scale-[1.02] font-semibold"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Endpoint
            </button>
          </div>

          {showWebhookForm && (
            <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl p-4 space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Endpoint URL</label>
                <input
                  type="url"
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://your-server.com/webhooks/hybridshare"
                  className="w-full bg-zinc-950 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-brand-gray-dark dark:text-dark-text-muted focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-2">Events to Subscribe</label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map((evt) => (
                    <label key={evt.value} className="flex items-center gap-2 cursor-pointer group">
                      <div className={cn(
                        'w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                        webhookForm.events.includes(evt.value) ? 'bg-brand-red border-brand-red' : 'border-zinc-600 group-hover:border-zinc-500'
                      )}>
                        {webhookForm.events.includes(evt.value) && (
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <input type="checkbox" className="sr-only" checked={webhookForm.events.includes(evt.value)} onChange={() => toggleWebhookEvent(evt.value)} />
                      <span className="text-xs text-brand-black dark:text-dark-text group-hover:text-white transition-colors">{evt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWebhookForm(false)} className="flex-1 py-2 bg-brand-white-soft dark:bg-dark-surface-2 text-sm text-white rounded-lg hover:bg-brand-gray dark:bg-dark-surface-3 transition-all font-medium">Cancel</button>
                <button type="button" onClick={handleAddWebhook} className="flex-1 py-2 bg-brand-red text-sm text-white rounded-lg hover:bg-red-700 transition-all font-semibold hover:scale-[1.01]">Add Webhook</button>
              </div>
            </div>
          )}

          {webhooks.map((wh) => (
            <div key={wh.id} className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl p-4 hover:border-brand-gray dark:border-dark-border transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('w-2 h-2 rounded-full', wh.isActive ? 'bg-green-400' : 'bg-zinc-600')} />
                    <code className="text-xs text-brand-black dark:text-dark-text font-mono truncate">{wh.url}</code>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {wh.events.map((e) => (
                      <span key={e} className="text-xs bg-brand-white-soft dark:bg-dark-surface-2 text-brand-gray-dark dark:text-dark-text-muted px-1.5 py-0.5 rounded border border-brand-gray dark:border-dark-border">{e}</span>
                    ))}
                  </div>
                  {wh.failureCount > 0 && (
                    <p className="text-xs text-amber-400 mt-1.5">{wh.failureCount} recent failure{wh.failureCount !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteWebhook(wh.id)}
                  className="p-1.5 text-zinc-600 hover:text-brand-red hover:bg-brand-white-soft dark:bg-dark-surface-2 rounded transition-all shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save bar (not shown for Members/Webhooks) */}
      {!['Members', 'Webhooks'].includes(activeTab) && (
        <div className="mt-8 flex justify-end pt-6 border-t border-brand-gray dark:border-dark-border">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
              saved ? 'bg-green-600 text-white' : 'bg-brand-red text-white hover:bg-red-700',
              isSaving && 'opacity-60 cursor-not-allowed'
            )}
          >
            {saved ? 'âœ“ Saved' : isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
