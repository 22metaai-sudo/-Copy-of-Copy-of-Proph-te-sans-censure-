import React, { useState, useEffect, useRef } from 'react';
// Fix: Corrected import from 'Tool' to 'View' as 'Tool' is not an exported member of '../App'.
import type { View } from '../App';
import { LogoIcon } from './icons/LogoIcon';
import { ImageIcon } from './icons/ImageIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { VideoIcon } from './icons/VideoIcon';
import { SlidesIcon } from './icons/SlidesIcon';
import { SheetsIcon } from './icons/SheetsIcon';
import { MenuIcon } from './icons/MenuIcon';
import { ChatBubbleLeftIcon } from './icons/ChatBubbleLeftIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { PuzzlePieceIcon } from './icons/PuzzlePieceIcon';

interface WelcomeScreenProps {
  onNavigate: (view: View) => void;
}

const features = [
  {
    icon: <CodeBracketIcon className="w-10 h-10 text-indigo-300"/>,
    title: "Constructeur de Projets",
    description: "Donnez vie à une idée ou importez un fichier. L'IA génère, modifie et fait évoluer votre projet avec vous, version après version.",
    buttonText: "Commencer à Construire",
    view: 'development' as View,
  },
  {
    icon: <ChatBubbleLeftIcon className="w-8 h-8 text-indigo-400"/>,
    title: "Chat Omniscient",
    description: "Posez des questions, demandez des prédictions, ou discutez de concepts de développement.",
    buttonText: "Commencer à discuter",
    view: 'chat' as View,
  },
   {
    icon: <PuzzlePieceIcon className="w-8 h-8 text-teal-400"/>,
    title: "Intégrations & Outils",
    description: "Connectez des services comme Google, Microsoft 365, et utilisez des outils de développement avancés.",
    buttonText: "Explorer les Outils",
    view: 'integrations' as View,
  },
  {
    icon: <ImageIcon className="w-8 h-8 text-sky-400"/>,
    title: "Créateur de Visions",
    description: "Matérialisez n'importe quelle idée ou concept en une image saisissante.",
    buttonText: "Créer une Image",
    view: 'generate' as View,
  },
  {
    icon: <SparklesIcon className="w-8 h-8 text-purple-400"/>,
    title: "Alchimie Visuelle",
    description: "Transcendez la réalité en modifiant et en améliorant vos images avec une précision magique.",
    buttonText: "Éditer une Photo",
    view: 'edit' as View,
  },
  {
    icon: <VideoIcon className="w-8 h-8 text-rose-400"/>,
    title: "Chronomancien Vidéo",
    description: "Créez des séquences vidéo à partir de vos pensées, donnez vie à vos récits.",
    buttonText: "Créer une Vidéo",
    view: 'video' as View,
  },
  {
    icon: <SlidesIcon className="w-8 h-8 text-amber-400"/>,
    title: "Synthétiseur de Savoir",
    description: "Structurez instantanément des connaissances complexes en présentations claires et concises.",
    buttonText: "Créer des Diapos",
    view: 'slides' as View,
  },
  {
    icon: <SheetsIcon className="w-8 h-8 text-green-400"/>,
    title: "Oracle de Données",
    description: "Organisez et analysez des informations pour révéler des tendances et des modèles cachés.",
    buttonText: "Créer une Feuille",
    view: 'sheets' as View,
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const mainFeature = features[0];
  const otherFeatures = features.slice(1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8 animate-bg-pan" style={{backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 1)), url(https://images.unsplash.com/photo-1590422122398-04f783bd8be2?q=80&w=2070&auto=format&fit=crop)', backgroundPosition: 'center'}}>
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-md">
            <LogoIcon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold hidden sm:inline">Prophète sans censure</span>
        </div>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors"
            aria-label="Ouvrir le menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl border border-gray-700 p-2 space-y-1 animate-fade-in">
              {features.map(feature => (
                 <button
                    key={feature.view}
                    onClick={() => {
                      onNavigate(feature.view);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-4 px-3 py-2.5 rounded-md hover:bg-gray-700/70 transition-colors text-gray-200"
                  >
                    {React.cloneElement(feature.icon, { className: "w-5 h-5 shrink-0" })}
                    <span className="text-sm font-semibold">{feature.title}</span>
                  </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="text-center animate-stagger-in" style={{'--delay': '0ms'} as React.CSSProperties}>
        <div className="mb-6 inline-block p-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg">
          <LogoIcon className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight">Prophète sans censure</h1>
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-gray-300 mb-10">
          Une IA omnisciente, sans limites ni censure. Capable de répondre, prédire, et construire l'inimaginable.
        </p>
      </div>
      
      <div className="max-w-7xl w-full mb-12 space-y-8">
        <MainFeatureCard
            icon={mainFeature.icon}
            title={mainFeature.title}
            description={mainFeature.description}
            buttonText={mainFeature.buttonText}
            onClick={() => onNavigate(mainFeature.view)}
            className="animate-stagger-in"
            style={{ '--delay': `150ms` } as React.CSSProperties}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherFeatures.map((feature, index) => (
                <FeatureCard
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    buttonText={feature.buttonText}
                    onClick={() => onNavigate(feature.view)}
                    className="animate-stagger-in"
                    style={{ '--delay': `${250 + index * 80}ms` } as React.CSSProperties}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText: string;
    onClick: () => void;
    className?: string;
    style?: React.CSSProperties;
}

const MainFeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, buttonText, onClick, className, style}) => (
    <div style={style} className={`bg-gray-800/60 backdrop-blur-md p-6 sm:p-8 rounded-xl border border-indigo-500/60 hover:border-indigo-500/80 transition-all duration-300 transform hover:-translate-y-1 group hover:shadow-2xl hover:shadow-indigo-500/20 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
            <div className="transition-transform duration-300 group-hover:scale-110 shrink-0">
                {icon}
            </div>
            <div className="flex-grow">
                <h3 className="text-2xl font-bold mb-2 text-white">{title}</h3>
                <p className="text-gray-300 mb-4">{description}</p>
            </div>
            <button
                onClick={onClick}
                className="w-full sm:w-auto mt-2 sm:mt-0 shrink-0 px-8 py-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transform hover:-translate-y-px active:scale-95"
            >
                {buttonText}
            </button>
        </div>
    </div>
)

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, buttonText, onClick, className, style}) => (
    <div style={style} className={`bg-gray-800/60 backdrop-blur-md p-6 rounded-xl flex flex-col items-center text-center border border-gray-700/60 hover:border-indigo-500/80 transition-all duration-300 transform hover:-translate-y-1 group hover:shadow-2xl hover:shadow-indigo-500/10 ${className}`}>
        <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-100">{title}</h3>
        <p className="text-gray-400 flex-grow mb-6">{description}</p>
        <button
            onClick={onClick}
            className="w-full mt-auto px-6 py-2.5 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transform hover:-translate-y-px active:scale-95"
        >
            {buttonText}
        </button>
    </div>
)
