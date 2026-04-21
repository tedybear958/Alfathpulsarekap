import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeColor = 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate';

interface ThemeState {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'blue',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'alfath-theme-storage',
    }
  )
);
