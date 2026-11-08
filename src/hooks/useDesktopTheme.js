import { useState, useEffect, useCallback } from 'react';
import { isMuted, setMuted } from '../utils/sound';

const WALLPAPER_KEY = 'paradiso-wallpaper';
const CRT_KEY = 'paradiso-crt-mode';

export const WALLPAPERS = [
  { id: 'sunset', name: 'Vaporwave Sunset', color: 'linear-gradient(160deg, #8f8aa6, #a9bfc4)' },
  { id: 'teal', name: 'Windows 95 Teal', color: '#008080' },
  { id: 'cyberpunk', name: 'Midnight Cyberpunk', color: 'linear-gradient(180deg, #120e24 0%, #1c1438 100%)' },
  { id: 'parchment', name: 'Cream Parchment', color: '#efe7dc' },
  { id: 'sakura', name: 'Tokyo Sakura', color: 'linear-gradient(135deg, #fce4ec 0%, #e1bee7 100%)' },
  { id: 'matrix', name: 'Game Boy / Matrix', color: '#0f380f' },
  { id: 'synthwave', name: '80s Synthwave Grid', color: '#190e2e' },
  { id: 'macos', name: 'Classic Mac OS', color: '#d4d0c8' },
];

export const CRT_MODES = ['retro', 'subtle', 'off'];

export function useDesktopTheme() {
  const [wallpaper, setWallpaper] = useState(() => {
    try {
      return localStorage.getItem(WALLPAPER_KEY) || 'sunset';
    } catch {
      return 'sunset';
    }
  });

  const [crtMode, setCrtMode] = useState(() => {
    try {
      return localStorage.getItem(CRT_KEY) || 'retro';
    } catch {
      return 'retro';
    }
  });

  const [muted, setMutedState] = useState(() => isMuted());

  // Apply wallpaper
  useEffect(() => {
    document.documentElement.setAttribute('data-wallpaper', wallpaper);
    try {
      localStorage.setItem(WALLPAPER_KEY, wallpaper);
    } catch {
      // ignore
    }
  }, [wallpaper]);

  // Apply CRT mode
  useEffect(() => {
    document.documentElement.setAttribute('data-crt', crtMode);
    try {
      localStorage.setItem(CRT_KEY, crtMode);
    } catch {
      // ignore
    }
  }, [crtMode]);

  const toggleSound = useCallback(() => {
    setMutedState(prev => {
      const next = !prev;
      setMuted(next);
      return next;
    });
  }, []);

  const cycleCrt = useCallback(() => {
    setCrtMode(prev => {
      const idx = CRT_MODES.indexOf(prev);
      const next = CRT_MODES[(idx + 1) % CRT_MODES.length];
      return next;
    });
  }, []);

  return {
    wallpaper,
    setWallpaper,
    crtMode,
    cycleCrt,
    muted,
    toggleSound,
  };
}
