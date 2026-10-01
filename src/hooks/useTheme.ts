import { useState, useEffect, useCallback } from 'react';
import type { ThemeMode } from '@/ast/types';

const STORAGE_KEY = 'vads-theme';

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored) return stored;
    }
    return 'dark';
  });

  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = themeMode === 'system' ? systemDark : themeMode === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const setMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const setModeWithoutPersist = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
  }, []);

  return { themeMode, setMode, setModeWithoutPersist, isDark };
}
