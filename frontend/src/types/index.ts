export interface Analysis {
  companyName: string;
  industry: string;
  concept: string;
  colors: string[];
  mood: string;
  target: string;
  logoType: 'symbol' | 'wordmark' | 'combination';
  keywords?: string[];
  avoidColors?: string[];
  avoidElements?: string[];
  preferredStyle?: string;
  additionalNotes?: string;
}

export interface Mockups {
  businessCard: string;
  signboard: string;
  website: string;
}

export type AppStep =
  | 'input'
  | 'fetching'
  | 'analyzing'
  | 'generating'
  | 'selecting'
  | 'revising'
  | 'proposal'
  | 'proposalGenerating';

export interface LogoGeneratorState {
  briefText: string;
  analysis: Analysis | null;
  prompts: string[];
  rawLogos: string[];
  logos: string[];
  selectedLogoIndex: number;
  proposalText: string;
  mockups: Mockups | null;
  step: AppStep;

  setBriefText: (text: string) => void;
  setAnalysis: (analysis: Analysis | null) => void;
  setPrompts: (prompts: string[]) => void;
  setRawLogos: (logos: string[]) => void;
  setLogos: (logos: string[]) => void;
  addLogo: (logo: string) => void;
  replaceRawLogo: (index: number, logo: string) => void;
  setSelectedLogoIndex: (index: number) => void;
  setProposalText: (text: string) => void;
  setMockups: (mockups: Mockups | null) => void;
  replaceLogo: (index: number, logo: string) => void;
  replacePrompt: (index: number, prompt: string) => void;
  setStep: (step: AppStep) => void;
  reset: () => void;
}
