/**
 * IRM Sentinel — Industry Vertical Store
 *
 * Zustand store with localStorage persistence.
 * When the user selects an industry, everything downstream adapts:
 * - Seed data regenerates for that vertical
 * - AI narrative tone adjusts
 * - Frameworks, risk categories, KRI templates change
 * - Copilot knowledge base is industry-aware
 */

import { create } from 'zustand';
import { IndustryId, getIndustryConfig, type IndustryConfig } from '../config/industries';

const STORAGE_KEY = 'irm-industry';

interface IndustryState {
  /** Currently selected industry vertical */
  industryId: IndustryId;

  /** Convenience getter for the full config */
  config: IndustryConfig;

  /** Whether the user has explicitly selected an industry (vs. default) */
  hasSelected: boolean;

  /** Switch to a different industry vertical */
  setIndustry: (id: IndustryId) => void;
}

function loadPersistedIndustry(): { id: IndustryId; hasSelected: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.id && ['banking', 'healthcare', 'technology', 'energy', 'manufacturing'].includes(parsed.id)) {
        return { id: parsed.id as IndustryId, hasSelected: true };
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { id: 'banking', hasSelected: false };
}

const initial = loadPersistedIndustry();

export const useIndustryStore = create<IndustryState>((set) => ({
  industryId: initial.id,
  config: getIndustryConfig(initial.id),
  hasSelected: initial.hasSelected,

  setIndustry: (id: IndustryId) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id }));
    set({
      industryId: id,
      config: getIndustryConfig(id),
      hasSelected: true,
    });
  },
}));
