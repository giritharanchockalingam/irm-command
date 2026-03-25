import { create } from 'zustand';

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AppState {
  currentModule: string;
  selectedEntityId: string | null;
  selectedEntityType: string | null;
  copilotOpen: boolean;
  copilotMessages: CopilotMessage[];

  setModule: (module: string) => void;
  selectEntity: (type: string, id: string) => void;
  clearEntity: () => void;
  toggleCopilot: () => void;
  addCopilotMessage: (role: 'user' | 'assistant', content: string) => void;
  clearCopilotMessages: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentModule: 'dashboard',
  selectedEntityId: null,
  selectedEntityType: null,
  copilotOpen: false,
  copilotMessages: [],

  setModule: (module: string) => {
    set({ currentModule: module });
  },

  selectEntity: (type: string, id: string) => {
    set({
      selectedEntityType: type,
      selectedEntityId: id,
    });
  },

  clearEntity: () => {
    set({
      selectedEntityId: null,
      selectedEntityType: null,
    });
  },

  toggleCopilot: () => {
    set((state) => ({
      copilotOpen: !state.copilotOpen,
    }));
  },

  addCopilotMessage: (role: 'user' | 'assistant', content: string) => {
    set((state) => ({
      copilotMessages: [
        ...state.copilotMessages,
        {
          role,
          content,
          timestamp: Date.now(),
        },
      ],
    }));
  },

  clearCopilotMessages: () => {
    set({
      copilotMessages: [],
    });
  },
}));
