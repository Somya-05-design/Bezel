import React, { useState, useEffect, useRef } from 'react';
import { Sun, Monitor, Moon, Check } from 'lucide-react';

export type ThemeMode = 'light' | 'system' | 'dark';

export const ThemeSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('bezel_theme') as ThemeMode) || 'system';
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      let resolved: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolved = prefersDark ? 'dark' : 'light';
      } else {
        resolved = theme;
      }

      document.documentElement.setAttribute('data-theme', resolved);
      document.body.setAttribute('data-theme', resolved);
      localStorage.setItem('bezel_theme', theme);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Light',
      icon: <Sun size={18} strokeWidth={2} />,
    },
    {
      id: 'system',
      label: 'System',
      icon: <Monitor size={18} strokeWidth={2} />,
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: <Moon size={18} strokeWidth={2} />,
    },
  ];

  return (
    <div className="theme-switcher-wrapper" ref={containerRef}>
      {/* Theme Options Dropdown Menu */}
      {isOpen && (
        <div className="theme-dropdown-menu" role="menu">
          {options.map((option) => {
            const isSelected = theme === option.id;
            return (
              <button
                key={option.id}
                className={`theme-menu-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setTheme(option.id);
                  setIsOpen(false);
                }}
                role="menuitem"
              >
                <span className="theme-item-icon">{option.icon}</span>
                <span className="theme-item-label">{option.label}</span>
                {isSelected && (
                  <span className="theme-item-check">
                    <Check size={16} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Screen / Monitor Trigger Button */}
      <button
        className={`bottom-right-theme-btn ${isOpen ? 'active' : ''}`}
        title="Change Theme (Light / System / Dark)"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Theme options"
        aria-expanded={isOpen}
      >
        <Monitor size={20} strokeWidth={2} />
      </button>
    </div>
  );
};
