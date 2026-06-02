import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { User } from '@hybridshare/shared/types/user';

interface ProfilePreviewProps {
  /** Partial user so it can show live preview as the form changes */
  data: Partial<Pick<User, 'name' | 'avatar' | 'jobTitle' | 'bio' | 'website' | 'linkedinUrl' | 'twitterHandle'>>;
  className?: string;
}

export function ProfilePreview({ data, className }: ProfilePreviewProps) {
  const { name = 'Your Name', avatar, jobTitle, bio, website, linkedinUrl, twitterHandle } = data;

  return (
    <div className={cn('card p-5 border-dashed', className)}>
      <p className="text-[10px] font-bold text-brand-gray-dark uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        How others see you
      </p>

      <div className="flex items-start gap-3">
        <Avatar name={name} src={avatar} size="md" className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-black dark:text-white truncate">
            {name || <span className="text-brand-gray-dark italic">Your Name</span>}
          </p>
          {jobTitle ? (
            <p className="text-xs text-brand-gray-dark truncate">{jobTitle}</p>
          ) : (
            <p className="text-xs text-brand-gray-dark/40 italic">Job title</p>
          )}
          {bio ? (
            <p className="text-xs text-brand-gray-dark mt-1.5 leading-relaxed line-clamp-3">{bio}</p>
          ) : (
            <p className="text-xs text-brand-gray-dark/30 italic mt-1.5">No bio yet</p>
          )}

          {(website || linkedinUrl || twitterHandle) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {website && (
                <a href={website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] text-brand-red hover:underline">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {linkedinUrl && (
                <span className="text-[10px] text-brand-gray-dark">
                  in/{linkedinUrl}
                </span>
              )}
              {twitterHandle && (
                <span className="text-[10px] text-brand-gray-dark">
                  @{twitterHandle}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
