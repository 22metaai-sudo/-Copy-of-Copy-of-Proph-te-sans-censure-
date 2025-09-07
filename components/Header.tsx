import React, { useState, useRef, useEffect } from 'react';
import type { Theme, View } from '../App';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { MenuIcon } from './icons/MenuIcon';
import { ScanIcon } from './icons/ScanIcon';
import { Squares2x2Icon } from './icons/Squares2x2Icon';
import { HomeIcon } from './icons/HomeIcon';
import { ChatBubbleLeftIcon } from './icons/ChatBubbleLeftIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { ImageIcon } from './icons/ImageIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { VideoIcon } from './icons/VideoIcon';
import { SlidesIcon } from './icons/SlidesIcon';
import { SheetsIcon } from './icons/SheetsIcon';
import { PuzzlePieceIcon } from './icons/PuzzlePieceIcon';

interface HeaderProps {
  title: string;
  theme: Theme;
  toggleTheme: () => void;
  isSidebarVisible: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeView: View;
  onNavigate: (view: View) => void;
  onGoHome: () => void;
}

const navigationItems = [
    { view: 'chat' as View, label: 'Chat', icon: ChatBubbleLeftIcon },
    { type: 'separator' as const },
    { view: 'development' as View, label: 'Développement', icon: CodeBracketIcon },
    { view: 'generate' as View, label: 'Générer une Image', icon: ImageIcon },
    { view: 'edit' as View, label: 'Éditer une Image', icon: SparklesIcon },
    { view: 'video' as View, label: 'Générer une Vidéo', icon: VideoIcon },
    { type: 'separator' as const },
    { view: 'slides' as View, label: 'Générer des Diapos', icon: SlidesIcon },
    { view: 'sheets' as View, label: 'Générer une Feuille de calcul', icon: SheetsIcon },
    { type: 'separator' as const },
    { view: 'integrations' as View, label: 'Intégrations', icon: PuzzlePieceIcon },
];

export const Header: React.FC<HeaderProps> = ({
  title,
  theme,
  toggleTheme,
  isSidebarVisible,
  isSidebarOpen,
  toggleSidebar,
  activeView,
  onNavigate,
  onGoHome
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            menuRef.current && !menuRef.current.contains(event.target as Node) &&
            buttonRef.current && !buttonRef.current.contains(event.target as Node)
        ) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (view: View) => {
      onNavigate(view);
      setIsMenuOpen(false);
  };
  
  const handleGoHome = () => {
      onGoHome();
      setIsMenuOpen(false);
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700/60 shrink-0 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md z-10 relative">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
            <button
                ref={buttonRef}
                id="tools-menu-button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                aria-label="Ouvrir le menu des outils"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                aria-controls="tools-menu"
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <Squares2x2Icon className="w-6 h-6" />
            </button>
            {isMenuOpen && (
                <div
                    ref={menuRef}
                    id="tools-menu"
                    role="menu"
                    aria-labelledby="tools-menu-button"
                    className="absolute top-full mt-2 left-0 w-72 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/60 p-2 z-50"
                >
                    <div className="p-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Prophète</div>
                    <button
                        role="menuitem"
                        onClick={handleGoHome}
                        className="w-full flex items-center gap-4 px-3 py-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
                    >
                        <HomeIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                        <span className="font-semibold">Accueil</span>
                    </button>
                    <div className="h-px bg-gray-200 dark:bg-gray-700/60 my-2" />
                    {navigationItems.map((item, index) => {
                        // Fix: Use a type guard with 'in' operator to correctly narrow down the union type for TypeScript.
                        // This resolves the issue where `item` was being inferred as `never` after the conditional check.
                        if ('type' in item && item.type === 'separator') {
                            return <div key={`sep-${index}`} className="h-px bg-gray-200 dark:bg-gray-700/60 my-2" />;
                        }
                        const Icon = item.icon;
                        const isActive = activeView === item.view;
                        return (
                             <button
                                key={item.view}
                                role="menuitem"
                                onClick={() => handleNavigate(item.view)}
                                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md transition-colors ${
                                    isActive
                                    ? 'bg-indigo-500/20 text-indigo-800 dark:bg-indigo-500/30 dark:text-white'
                                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                                <span className="font-semibold">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
        
        {isSidebarVisible && (
            <button
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Fermer le panneau" : "Ouvrir le panneau"}
              aria-expanded={isSidebarOpen}
              aria-controls="sidebar"
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
          aria-label={`Passer en mode ${theme === 'light' ? 'sombre' : 'clair'}`}
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