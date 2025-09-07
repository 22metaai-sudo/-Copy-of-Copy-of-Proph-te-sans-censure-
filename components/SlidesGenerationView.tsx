import React, { useState, useCallback } from 'react';
import { generateSlides, Slide, getErrorMessage } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { SlidesIcon } from './icons/SlidesIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-lg shadow-gray-200/30 dark:shadow-black/30 ${className}`}>
        {children}
    </div>
);

export const SlidesGenerationView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isCopied, setIsCopied] = useState(false);
    const [slideCount, setSlideCount] = useState(5);

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) {
            setError("Veuillez entrer un sujet pour la présentation.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSlides([]);
        setCurrentSlide(0);

        try {
            const generatedSlides = await generateSlides(topic, slideCount);
            setSlides(generatedSlides);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [topic, slideCount]);

    const goToNextSlide = () => {
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
    };

    const goToPrevSlide = () => {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
    };

    const handleCopySlide = () => {
        if (!slide || isCopied) return;
        const slideText = `${slide.title}\n\n${slide.content.map(p => `• ${p}`).join('\n')}`;
        navigator.clipboard.writeText(slideText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy slide text:", err);
            setError("Impossible de copier le texte.")
        });
    };
    
    const handleDownloadTxt = () => {
        if (slides.length === 0) return;
        const fullText = slides.map((s, i) => {
            return `Diapositive ${i + 1}: ${s.title}\n\n${s.content.map(p => `• ${p}`).join('\n')}`;
        }).join('\n\n---\n\n');
        
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `presentation-${topic.replace(/\s+/g, '_') || 'export'}.txt`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const slide = slides[currentSlide];

    return (
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto bg-transparent">
            <div className="w-full max-w-4xl flex flex-col gap-6">
                <Card>
                    <h2 className="text-2xl font-bold mb-4">Générateur de Diapos IA</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Entrez un sujet et laissez l'IA créer une présentation pour vous.</p>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="Ex: L'histoire du carnaval en Haïti"
                            aria-label="Sujet de la présentation"
                            className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            disabled={isLoading}
                        />
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="flex items-center gap-3">
                                <label htmlFor="slide-count" className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">Nombre de diapos:</label>
                                <input
                                    type="number"
                                    id="slide-count"
                                    value={slideCount}
                                    onChange={e => {
                                        const count = parseInt(e.target.value, 10);
                                        if (!isNaN(count)) {
                                            setSlideCount(Math.max(3, Math.min(15, count)));
                                        }
                                    }}
                                    className="w-20 p-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                    min="3"
                                    max="15"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg transform hover:-translate-y-px"
                            >
                                <SparklesIcon className="h-6 w-6" />
                                {isLoading ? 'Génération...' : 'Générer'}
                            </button>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                     {isLoading && (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400 mx-auto mb-4"></div>
                            <p>L'IA prépare votre présentation...</p>
                        </div>
                    )}
                    {!isLoading && slides.length > 0 && slide && (
                        <Card className="w-full h-full flex flex-col">
                            <div className="flex-grow">
                                <h3 className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-300 mb-6">{slide.title}</h3>
                                <ul className="space-y-4 list-disc pl-6 text-lg text-gray-800 dark:text-gray-200">
                                    {slide.content.map((point, index) => <li key={index}>{point}</li>)}
                                </ul>
                            </div>
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/60">
                                <button onClick={goToPrevSlide} disabled={currentSlide === 0} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors">Précédent</button>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleCopySlide} className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label="Copier le contenu de la diapositive">
                                         {isCopied ? <CheckIcon className="h-5 w-5 text-green-500"/> : <ClipboardIcon className="h-5 w-5"/>}
                                        <span className="hidden sm:inline">{isCopied ? 'Copié' : 'Copier'}</span>
                                    </button>
                                     <button onClick={handleDownloadTxt} className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label="Télécharger toute la présentation en .txt">
                                        <DownloadIcon className="h-5 w-5"/>
                                        <span className="hidden sm:inline">TXT</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-500 dark:text-gray-400 font-semibold">{currentSlide + 1} / {slides.length}</span>
                                    <button onClick={goToNextSlide} disabled={currentSlide === slides.length - 1} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors">Suivant</button>
                                </div>
                            </div>
                        </Card>
                    )}
                    {!isLoading && slides.length === 0 && (
                         <Card className="w-full">
                            <div className="text-center text-gray-400 dark:text-gray-500 p-4">
                                <SlidesIcon className="h-20 w-20 mx-auto mb-4 opacity-50"/>
                                <p className="font-semibold text-lg">Votre présentation apparaîtra ici</p>
                            </div>
                         </Card>
                    )}
                    {error && <div className="text-red-600 dark:text-red-400 text-center mt-4 w-full p-3 bg-red-500/10 dark:bg-red-900/20 rounded-lg">{error}</div>}
                </div>
            </div>
        </div>
    );
};