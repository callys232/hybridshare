'use client';

import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number;
  className?: string;
}

export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className={cn('flex items-center', className)}>
      {steps.map((step, idx) => {
        const status =
          step.id < current ? 'done' : step.id === current ? 'active' : 'upcoming';

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ring-2',
                status === 'done'   && 'bg-brand-black text-white ring-brand-black',
                status === 'active' && 'bg-brand-red text-white ring-brand-red shadow-[0_0_0_4px_rgba(193,33,41,0.15)]',
                status === 'upcoming' && 'bg-white text-brand-gray-dark ring-brand-gray',
              )}>
                {status === 'done' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-1.5 text-center">
                <p className={cn(
                  'text-[11px] font-semibold whitespace-nowrap',
                  status === 'active' ? 'text-brand-black dark:text-white' : 'text-brand-gray-dark'
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-brand-gray-dark hidden sm:block">{step.description}</p>
                )}
              </div>
            </div>

            {/* Connector line — between steps */}
            {idx < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 mb-6 rounded-full transition-all duration-500',
                step.id < current ? 'bg-brand-black' : 'bg-brand-gray'
              )} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
