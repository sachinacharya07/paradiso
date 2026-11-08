import { useState, useEffect } from 'react';
import { WALLPAPERS, CRT_MODES } from '../hooks/useDesktopTheme';
import { playBeep } from '../utils/sound';

/**
 * Windows 95-style desktop right-click context menu.
 */
export default function DesktopContextMenu({
  wallpaper,
  setWallpaper,
  crtMode,
  cycleCrt,
  muted,
  toggleSound,
  onOpenSpecs,
}) {
  const [pos, setPos] = useState(null);
  const [showWallpapers, setShowWallpapers] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e) => {
      // Only open if clicking on the desktop background (not inside a window or button)
      if (e.target.closest('.win, input, textarea, select, button, a')) {
        return;
      }
      e.preventDefault();
      playBeep();
      const x = Math.min(window.innerWidth - 190, e.clientX);
      const y = Math.min(window.innerHeight - 220, e.clientY);
      setPos({ x, y });
      setShowWallpapers(false);
    };

    const handleClick = () => {
      setPos(null);
      setShowWallpapers(false);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  if (!pos) return null;

  return (
    <div
      className="win desktop-context-menu"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bar context-bar">
        <span>Desktop Options</span>
      </div>
      <div className="context-items">
        {/* Wallpapers Submenu */}
        <div
          className="context-item context-submenu-parent"
          onMouseEnter={() => setShowWallpapers(true)}
          onClick={() => setShowWallpapers(!showWallpapers)}
        >
          <span>🖼 Wallpaper</span>
          <span className="context-arrow">▶</span>

          {showWallpapers && (
            <div className="win context-submenu">
              {WALLPAPERS.map((wp) => (
                <div
                  key={wp.id}
                  className={`context-item ${wallpaper === wp.id ? 'active' : ''}`}
                  onClick={() => {
                    playBeep();
                    setWallpaper(wp.id);
                    setPos(null);
                  }}
                >
                  {wallpaper === wp.id ? '✓ ' : '  '}
                  {wp.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cycle CRT Mode */}
        <div
          className="context-item"
          onClick={() => {
            playBeep();
            cycleCrt();
          }}
        >
          <span>📺 CRT Mode: {crtMode.toUpperCase()}</span>
        </div>

        {/* Toggle Sound */}
        <div
          className="context-item"
          onClick={() => {
            toggleSound();
            playBeep();
          }}
        >
          <span>{muted ? '🔇 Sound: OFF' : '🔊 Sound: ON'}</span>
        </div>

        <div className="context-divider"></div>

        {/* System Specs Modal */}
        <div
          className="context-item"
          onClick={() => {
            playBeep();
            onOpenSpecs();
            setPos(null);
          }}
        >
          <span>ℹ System Specs</span>
        </div>

        {/* Refresh */}
        <div
          className="context-item"
          onClick={() => {
            playBeep();
            window.location.reload();
          }}
        >
          <span>🔄 Refresh Desktop</span>
        </div>
      </div>
    </div>
  );
}
