import { create } from 'zustand';
import type { LogoGeneratorState } from '../types';

const initialState = {
  briefText: '',
  companyName: '',
  analysis: null,
  prompts: [],
  logos: [],
  selectedLogoIndex: -1,
  proposalText: '',
  mockups: null,
  step: 'input' as const,
};

export const useLogoStore = create<LogoGeneratorState>((set) => ({
  ...initialState,
  setBriefText: (text) => set({ briefText: text }),
  setCompanyName: (name) => set({ companyName: name }),
  setAnalysis: (analysis) => set({ analysis }),
  setPrompts: (prompts) => set({ prompts }),
  setLogos: (logos) => set({ logos }),
  addLogo: (logo) => set((state) => ({ logos: [...state.logos, logo] })),
  setSelectedLogoIndex: (index) => set({ selectedLogoIndex: index }),
  setProposalText: (text) => set({ proposalText: text }),
  setMockups: (mockups) => set({ mockups }),
  setStep: (step) => set({ step }),
  reset: () => set(initialState),
}));
