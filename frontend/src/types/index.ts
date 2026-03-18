export interface Analysis {
  companyName: string;
  industry: string;
  concept: string;
  colors: string[];
  mood: string;
  target: string;
  logoType: 'symbol' | 'wordmark' | 'combination';
}

export interface Mockups {
  businessCard: string;
  signboard: string;
  website: string;
}

export type AppStep =
  | 'input'
  | 'analyzing'
  | 'generating'
  | 'selecting'
  | 'proposal'
  | 'proposalGenerating';

export interface LogoGeneratorState {
  briefText: string;
  analysis: Analysis | null;
  prompts: string[];
  logos: string[];
  selectedLogoIndex: number;
  proposalText: string;
  mockups: Mockups | null;
  step: AppStep;

  setBriefText: (text: string) => void;
  setAnalysis: (analysis: Analysis | null) => void;
  setPrompts: (prompts: string[]) => void;
  setLogos: (logos: string[]) => void;
  addLogo: (logo: string) => void;
  setSelectedLogoIndex: (index: number) => void;
  setProposalText: (text: string) => void;
  setMockups: (mockups: Mockups | null) => void;
  setStep: (step: AppStep) => void;
  reset: () => void;
}
