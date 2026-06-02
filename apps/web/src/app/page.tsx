'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingNavbar } from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { Hero }          from '@/components/landing/Hero';
import { Stats }         from '@/components/landing/Stats';
import { Features }      from '@/components/landing/Features';
import { HowItWorks }   from '@/components/landing/HowItWorks';
import { Pricing }       from '@/components/landing/Pricing';
import { Testimonials }  from '@/components/landing/Testimonials';
import { CtaBanner }     from '@/components/landing/CtaBanner';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-brand-black">
      <LandingNavbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CtaBanner />
      <LandingFooter />
    </div>
  );
}
