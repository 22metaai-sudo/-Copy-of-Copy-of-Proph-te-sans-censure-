import React from 'react';
import type { View } from '../App';
import { LogoIcon } from './icons/LogoIcon';
import { ChatBubbleLeftIcon } from './icons/ChatBubbleLeftIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { VideoIcon } from './icons/VideoIcon';
import { PuzzlePieceIcon } from './icons/PuzzlePieceIcon';
import { ImageIcon } from './icons/ImageIcon';
import { SlidesIcon } from './icons/SlidesIcon';
import { SheetsIcon } from './icons/SheetsIcon';


interface MainRailProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onGoHome: () => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}> = ({ isActive, onClick, label, children }) => (
    <button
        onClick={onClick}
        aria-label={label}
        data-tooltip={label}
        className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-200 relative group ${
            isActive 
            ? 'bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/30'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100'
        }`}
    >
        {children}
    </button>
);


export const MainRail: React.FC<MainRailProps> = ({ activeView, onNavigate, onGoHome }) => {
    return (
        <nav className="h-full flex flex-col items-center p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-r border-gray-200 dark:border-gray-700/60 z-20 shrink-0">
            <div className="mb-8 mt-1">
                <button onClick={onGoHome} className="block p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-md hover:opacity-90 transition-opacity" aria-label="Go to Welcome Screen">
                    <LogoIcon className="h-7 w-7 text-white" />
                </button>
            </div>
            <div className="flex flex-col items-center gap-4">
                <NavButton isActive={activeView === 'chat'} onClick={() => onNavigate('chat')} label="Chat">
                    <ChatBubbleLeftIcon className="h-7 w-7" />
                </NavButton>

                <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 my-2"></div>

                <NavButton isActive={activeView === 'development'} onClick={() => onNavigate('development')} label="Développement">
                    <CodeBracketIcon className="h-7 w-7" />
                </NavButton>
                <NavButton isActive={activeView === 'generate'} onClick={() => onNavigate('generate')} label="Générer une Image">
                    <ImageIcon className="h-7 w-7" />
                </NavButton>
                <NavButton isActive={activeView === 'edit'} onClick={() => onNavigate('edit')} label="Éditer une Image">
                    <SparklesIcon className="h-7 w-7" />
                </NavButton>
                <NavButton isActive={activeView === 'video'} onClick={() => onNavigate('video')} label="Générer une Vidéo">
                    <VideoIcon className="h-7 w-7" />
                </NavButton>

                <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 my-2"></div>

                <NavButton isActive={activeView === 'slides'} onClick={() => onNavigate('slides')} label="Générer des Diapos">
                    <SlidesIcon className="h-7 w-7" />
                </NavButton>
                <NavButton isActive={activeView === 'sheets'} onClick={() => onNavigate('sheets')} label="Générer une Feuille de calcul">
                    <SheetsIcon className="h-7 w-7" />
                </NavButton>
                
                <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 my-2"></div>
                
                <NavButton isActive={activeView === 'integrations'} onClick={() => onNavigate('integrations')} label="Intégrations">
                    <PuzzlePieceIcon className="h-7 w-7" />
                </NavButton>

            </div>
            <div className="mt-auto">
                {/* Could add settings or profile icon here later */}
            </div>
        </nav>
    );
};
