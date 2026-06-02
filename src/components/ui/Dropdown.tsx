'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick: () => void;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 192;

      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: align === 'right'
          ? rect.right + window.scrollX - menuWidth
          : rect.left + window.scrollX,
      });
    };

    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, align]);

  return (
    <div ref={triggerRef} className={cn('relative inline-flex', className)}>
      <div
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded-lg"
      >
        {trigger}
      </div>

      {open && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="dropdown-menu"
            style={{ position: 'absolute', top: position.top, left: position.left, width: 192 }}
            role="menu"
          >
            {items.map((item) => (
              <div key={item.id}>
                {item.divider && <div className="divider my-1" />}
                <button
                  className={cn(item.danger ? 'dropdown-item-danger' : 'dropdown-item', 'w-full text-left')}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  role="menuitem"
                >
                  {item.icon && (
                    <span className={cn('w-4 h-4 flex-shrink-0', item.danger ? 'text-brand-red' : 'text-brand-gray-dark')}>
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
