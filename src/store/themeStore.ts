import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

const THEME_STORAGE_KEY = 'irm-theme';

export const useThemeStore = create<ThemeState>((set) => {
  // Initialize from localStorage
  const initializeDark = (): boolean => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored !== null) {
      return stored === 'dark';
    }
    // Default to dark mode
    return true;
  };

  const isDarkInitial = initializeDark();

  // Apply initial theme to DOM
  if (isDarkInitial) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }

  return {
    isDark: isDarkInitial,

    toggle: () => {
      set((state) => {
        const newIsDark = !state.isDark;
        applyTheme(newIsDark);
        return { isDark: newIsDark };
      });
    },

    setDark: (dark: boolean) => {
      set(() => {
        applyTheme(dark);
        return { isDark: dark };
      });
    },
  };
});

function applyTheme(isDark: boolean) {
  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
}
