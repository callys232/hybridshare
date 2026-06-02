'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useToast, ToastProvider } from '@/components/ui/Toast';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { ProfileInfoForm }  from '@/components/profile/ProfileInfoForm';
import { AvatarUpload }     from '@/components/profile/AvatarUpload';
import { ContactForm }      from '@/components/profile/ContactForm';
import { ProfilePreview }   from '@/components/profile/ProfilePreview';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Basic Info',    description: 'Name & bio'       },
  { id: 2, label: 'Profile Photo', description: 'Upload picture'   },
  { id: 3, label: 'Contact',       description: 'Links & socials'  },
];

function ProfileSettingsContent() {
  const { user, updateProfile, updateAvatar } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useToast();
  const [step, setStep] = useState(1);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Live preview data — updated as user saves each step
  const [previewName,    setPreviewName]    = useState(user?.name     ?? '');
  const [previewTitle,   setPreviewTitle]   = useState(user?.jobTitle ?? '');
  const [previewBio,     setPreviewBio]     = useState(user?.bio      ?? '');
  const [previewWebsite, setPreviewWebsite] = useState(user?.website  ?? '');
  const [previewLi,      setPreviewLi]      = useState(user?.linkedinUrl   ?? '');
  const [previewTw,      setPreviewTw]      = useState(user?.twitterHandle ?? '');

  const handleSaveBasic = async (data: { name: string; jobTitle: string; bio: string; timezone: string; language: string }) => {
    await updateProfile({ name: data.name, jobTitle: data.jobTitle, bio: data.bio, timezone: data.timezone, language: data.language });
    setPreviewName(data.name);
    setPreviewTitle(data.jobTitle);
    setPreviewBio(data.bio);
    toastSuccess('Basic info saved');
  };

  const handleUploadAvatar = async (file: File) => {
    await updateAvatar(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string ?? null);
    reader.readAsDataURL(file);
    toastSuccess('Profile photo updated');
  };

  const handleSaveContact = async (data: { website: string; linkedinUrl: string; twitterHandle: string }) => {
    await updateProfile({ website: data.website, linkedinUrl: data.linkedinUrl, twitterHandle: data.twitterHandle });
    setPreviewWebsite(data.website);
    setPreviewLi(data.linkedinUrl);
    setPreviewTw(data.twitterHandle);
    toastSuccess('Contact links saved');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-brand-black dark:text-white">Profile settings</h1>
        <p className="text-sm text-brand-gray-dark mt-1">
          Manage how you appear to your team and collaborators.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={STEPS} current={step} />

      {/* Step content */}
      <div className="card p-6">
        {step === 1 && (
          <ProfileInfoForm
            initialData={{
              name:      user?.name      ?? '',
              jobTitle:  user?.jobTitle  ?? '',
              bio:       user?.bio       ?? '',
              timezone:  user?.timezone  ?? 'UTC',
              language:  user?.language  ?? 'en',
            }}
            onSave={handleSaveBasic}
          />
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-brand-black dark:text-white">Profile photo</h2>
              <p className="text-sm text-brand-gray-dark mt-0.5">Your photo helps teammates recognise you instantly.</p>
            </div>
            <AvatarUpload
              name={previewName || user?.name || 'U'}
              currentAvatar={user?.avatar}
              onUpload={handleUploadAvatar}
              size="xl"
            />
          </div>
        )}

        {step === 3 && (
          <ContactForm
            initialData={{
              website:       user?.website       ?? '',
              linkedinUrl:   user?.linkedinUrl   ?? '',
              twitterHandle: user?.twitterHandle ?? '',
            }}
            onSave={handleSaveContact}
          />
        )}

        {/* Step navigation */}
        <div className={cn('flex mt-8 pt-5 border-t border-brand-gray dark:border-dark-border', step > 1 ? 'justify-between' : 'justify-end')}>
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-gray-dark hover:text-brand-black dark:hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          {step < 3 && (
            <button type="button" onClick={() => setStep((s) => s + 1)}
              className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5">
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {step === 3 && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              All steps complete
            </p>
          )}
        </div>
      </div>

      {/* Live profile preview */}
      <ProfilePreview
        data={{
          name:          previewName     || user?.name,
          avatar:        avatarPreview   ?? user?.avatar,
          jobTitle:      previewTitle    || user?.jobTitle,
          bio:           previewBio      || user?.bio,
          website:       previewWebsite  || user?.website,
          linkedinUrl:   previewLi       || user?.linkedinUrl,
          twitterHandle: previewTw       || user?.twitterHandle,
        }}
      />
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <ToastProvider>
      <ProfileSettingsContent />
    </ToastProvider>
  );
}
