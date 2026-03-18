import { apiClient } from './client';
import type { Analysis } from '../../types';

export const logoApi = {
  fetchUrl: async (url: string): Promise<string> => {
    const { data } = await apiClient.post('/api/fetch-url', { url });
    return data.text;
  },

  analyze: async (briefText: string): Promise<Analysis> => {
    const { data } = await apiClient.post('/api/analyze', { briefText });
    return data;
  },

  generatePrompts: async (analysis: Analysis): Promise<string[]> => {
    const { data } = await apiClient.post('/api/generate-prompts', { analysis });
    return data.prompts;
  },

  generateLogos: async (prompts: string[]): Promise<string[]> => {
    const { data } = await apiClient.post('/api/generate-logos', { prompts });
    return data.logos;
  },

  revisePrompt: async (originalPrompt: string, revisionInstruction: string): Promise<string> => {
    const { data } = await apiClient.post('/api/revise-prompt', { originalPrompt, revisionInstruction });
    return data.revisedPrompt;
  },

  generateProposal: async (
    analysis: Analysis,
    selectedPrompt: string
  ): Promise<string> => {
    const { data } = await apiClient.post('/api/generate-proposal', {
      analysis,
      selectedPrompt,
    });
    return data.proposal;
  },
};
