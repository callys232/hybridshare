'use client';

import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
}

export function Avatar({ name, src, size = 'md', className, showRing }: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  };

  const colorVariants = [
    'bg-brand-red text-white',
    'bg-brand-black text-white',
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-500 text-white',
    'bg-pink-600 text-white',
    'bg-cyan-600 text-white',
  ];

  const colorIndex = name.charCodeAt(0) % colorVariants.length;
  const bgColor = colorVariants[colorIndex];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none overflow-hidden',
        sizeClasses[size],
        !src && bgColor,
        showRing && 'ring-2 ring-white ring-offset-1',
        className
      )}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

interface AvatarGroupProps {
  users: Array<{ id: string; name: string; avatar?: string | null }>;
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user) => (
        <Avatar
          key={user.id}
          name={user.name}
          src={user.avatar}
          size={size}
          showRing
          className="transition-transform duration-150 hover:-translate-y-0.5 hover:z-10"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'rounded-full bg-brand-gray flex items-center justify-center font-semibold text-brand-gray-dark ring-2 ring-white',
            size === 'sm' && 'w-8 h-8 text-xs',
            size === 'md' && 'w-9 h-9 text-sm',
            size === 'lg' && 'w-11 h-11 text-base'
          )}
          title={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
