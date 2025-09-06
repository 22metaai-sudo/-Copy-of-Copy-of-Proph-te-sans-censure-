import React from 'react';
import { ScanIcon } from './icons/ScanIcon';
import type { Theme } from '../App';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { MenuIcon } from './icons/MenuIcon';

interface HeaderProps {
  title: string;
  theme: Theme;
  toggleTheme: () => void;
  isSidebarVisible: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  theme,
  toggleTheme,
  isSidebarVisible,
  isSidebarOpen,
  toggleSidebar
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700/60 shrink-0 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-4">
        {isSidebarVisible && (
            <button
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Fermer le panneau" : "Ouvrir le panneau"}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors -ml-2 sm:ml-0"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          )}
        <h1 className="text-lg font-semibold truncate text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>

        <button
          aria-label="Scan"
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ScanIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};