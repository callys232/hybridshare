import { create } from 'zustand';

export const TOUR_TOTAL = 16; // keep in sync with STEPS array in TourOverlay

interface TourStore {
  isActive: boolean;
  step: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  goTo: (step: number) => void;
}

export const useTourStore = create<TourStore>((set) => ({
  isActive: false,
  step: 0,
  start: () => set({ isActive: true, step: 0 }),
  next: () =>
    set((s) => {
      if (s.step >= TOUR_TOTAL - 1) return { isActive: false, step: 0 };
      return { step: s.step + 1 };
    }),
  prev: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
  stop: () => set({ isActive: false, step: 0 }),
  goTo: (step) => set({ step, isActive: true }),
}));
