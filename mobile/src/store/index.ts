// Global token for API interceptor access
const global = globalThis as unknown as { __token__?: string };
global.__token__ = undefined;

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

// Web环境下使用localStorage
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

const createWebStorage = () => ({
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
});

const webStorage = createWebStorage();

interface UserState {
  userId: string | null;
  token: string | null;
  displayName: string | null;
  setUser: (userId: string, token: string, displayName: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      token: null,
      displayName: null,
      setUser: (userId, token, displayName) => {
        global.__token__ = token;
        set({ userId, token, displayName });
      },
      logout: () => {
        global.__token__ = undefined;
        set({ userId: null, token: null, displayName: null });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => isWeb ? webStorage : AsyncStorage),
    }
  )
);

// 从localStorage恢复token到global
if (isWeb) {
  try {
    const stored = localStorage.getItem('user-storage');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.state?.token) {
        global.__token__ = data.state.token;
      }
    }
  } catch {}
}

interface EssayState {
  currentEssay: string;
  currentRubric: object | null;
  setCurrentEssay: (content: string) => void;
  setCurrentRubric: (rubric: object) => void;
  clearCurrent: () => void;
}

export const useEssayStore = create<EssayState>((set) => ({
  currentEssay: '',
  currentRubric: null,
  setCurrentEssay: (content) => set({ currentEssay: content }),
  setCurrentRubric: (rubric) => set({ currentRubric: rubric }),
  clearCurrent: () => set({ currentEssay: '', currentRubric: null }),
}));
