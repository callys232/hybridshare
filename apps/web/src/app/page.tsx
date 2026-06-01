'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingNavbar } from '@/component/layout/LandingNavbar';
import { LandingFooter } from '@/component/layout/LandingFooter';
import { Hero }          from '@/component/landing/Hero';
import { Stats }         from '@/component/landing/Stats';
import { Features }      from '@/component/landing/Features';
import { HowItWorks }   from '@/component/landing/HowItWorks';
import { Pricing }       from '@/component/landing/Pricing';
import { Testimonials }  from '@/component/landing/Testimonials';
import { CtaBanner }     from '@/component/landing/CtaBanner';

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
