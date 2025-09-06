import React, { useState, useCallback } from 'react';
import { generateImage, getErrorMessage, getImageDescription } from '../services/geminiService';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ImageIcon } from './icons/ImageIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

const creativeToolbox = {
    "Sujet": ["Personnage 3D", "Logo d'entreprise", "Paysage caribéen", "Plat créole", "Animal exotique", "Architecture coloniale", "Portrait réaliste", "Art abstrait"],
    "Style Artistique": ["Photographie", "Art numérique", "Peinture à l'huile", "Aquarelle", "Dessin animé", "Art vectoriel", "Style Anime/Manga", "Pixel art", "Noir et blanc"],
    "Ambiance & Éclairage": ["Cinématique", "Dramatique", "Rêveur", "Néon", "Éclairage de studio", "Contre-jour", "Heure dorée", "Ambiance sombre"],
    "Composition": ["Portrait (buste)", "Gros plan (close-up)", "Plan large", "Vu de dessus", "Symétrique", "Plan d'action", "Minimaliste"]
};

const ExamplePrompt: React.FC<{text: string, onSelect: (text: string) => void}> = ({ text, onSelect }) => (
    <button onClick={() => onSelect(text)} className="w-full text-left p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors">
        <p className="text-gray-600 dark:text-gray-300">{text}</p>
    </button>
);

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-lg shadow-gray-200/30 dark:shadow-black/30 ${className}`}>
        {children}
    </div>
);

export const ImageGenerationView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDescribing, setIsDescribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Veuillez entrer une description pour l'image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageBase64 = await generateImage(prompt, aspectRatio);
            setGeneratedImage(imageBase64);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [prompt, aspectRatio]);

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(prev => prev ? `${prev.trim().replace(/,$/, '')}, ${suggestion.toLowerCase()}` : suggestion);
    };

    const handleCopyImage = async () => {
        if (!generatedImage || isCopied) return;
        try {
            const blob = await (await fetch(`data:image/png;base64,${generatedImage}`)).blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy image: ", err);
            setError("Impossible de copier l'image.");
        }
    };
    
    const handleUseAsPrompt = async () => {
        if (!generatedImage) return;
        setIsDescribing(true);
        setError(null);
        try {
            const description = await getImageDescription({ data: generatedImage, mimeType: 'image/png' });
            setPrompt(description);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsDescribing(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto bg-transparent">
            <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6">
                
                {/* Left Panel: Controls */}
                <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col gap-6">
                    <Card>
                        <h2 className="text-2xl font-bold mb-4">Image Studio</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Décrivez l'image que vous souhaitez créer.</p>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Ex: Un colibri aux couleurs vives buvant le nectar d'un hibiscus sur une plage de la Caraïbe..."
                            className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-4"
                        />
                        
                        <h3 className="text-lg font-semibold mb-3">Format de l'image</h3>
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`py-2 rounded-lg transition-colors text-sm font-semibold ${aspectRatio === ratio ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                    {ratio}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || isDescribing}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg transform hover:-translate-y-px"
                        >
                            <SparklesIcon className="h-6 w-6" />
                            {isLoading ? 'Génération en cours...' : 'Générer'}
                        </button>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold mb-4">Boîte à Outils Créative</h3>
                        <div className="space-y-4">
                            {Object.entries(creativeToolbox).map(([category, items]) => (
                                <div key={category}>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{category}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {items.map(item => (
                                            <button key={item} onClick={() => handleSuggestionClick(item)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-bold mb-4">Besoin d'inspiration ?</h3>
                        <div className="space-y-2 text-sm">
                            <ExamplePrompt text="Un pirate squelette sirotant un cocktail sur une plage haïtienne, style art numérique." onSelect={setPrompt} />
                            <ExamplePrompt text="Logo pour une marque de café 'Kafé Karayib', style minimaliste et moderne." onSelect={setPrompt} />
                            <ExamplePrompt text="Une rue animée de Port-au-Prince avec des tap-taps colorés, style aquarelle." onSelect={setPrompt} />
                        </div>
                    </Card>
                </div>

                {/* Right Panel: Image Display */}
                <div className="w-full lg:w-1/2 xl:w-7/12">
                    <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl border border-gray-200/80 dark:border-gray-700/60 flex flex-col items-center justify-center p-4 sticky top-6 h-full min-h-[50vh] lg:min-h-[80vh] shadow-lg shadow-gray-200/30 dark:shadow-black/30">
                        <div className="w-full h-full flex-1 bg-gray-100 dark:bg-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
                            {isLoading && (
                                <div className="text-center text-gray-500 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                                    <p>L'IA imagine votre création...</p>
                                </div>
                            )}
                            {!isLoading && generatedImage && (
                                <>
                                    <img src={`data:image/png;base64,${generatedImage}`} alt="Generated art" className="w-full h-full object-contain" />
                                     <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 text-white px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={handleUseAsPrompt} disabled={isDescribing} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10" title="Utiliser comme prompt">
                                            {isDescribing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <ArrowPathIcon className="h-5 w-5"/>}
                                            <span>{isDescribing ? '' : 'Remixer'}</span>
                                        </button>
                                        <div className="w-px h-5 bg-gray-500"></div>
                                        <button onClick={handleCopyImage} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10" title="Copier l'image">
                                            {isCopied ? <CheckIcon className="h-5 w-5 text-green-400"/> : <ClipboardIcon className="h-5 w-5"/>}
                                            <span>{isCopied ? 'Copié' : ''}</span>
                                        </button>
                                        <div className="w-px h-5 bg-gray-500"></div>
                                        <a
                                            href={`data:image/png;base64,${generatedImage}`}
                                            download={`prophete-developpeur-ai-${Date.now()}.png`}
                                            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10"
                                            title="Télécharger l'image"
                                        >
                                            <DownloadIcon className="h-5 w-5"/>
                                        </a>
                                    </div>
                                </>
                            )}
                            {!isLoading && !generatedImage && (
                                <div className="text-center text-gray-400 dark:text-gray-500 p-4">
                                    <ImageIcon className="h-20 w-20 mx-auto mb-4 opacity-50"/>
                                    <p className="font-semibold text-lg">Votre image apparaîtra ici</p>
                                    <p className="text-sm">Décrivez ce que vous voulez créer et cliquez sur "Générer".</p>
                                </div>
                            )}
                        </div>
                        {error && <div className="text-red-600 dark:text-red-400 text-center mt-4 w-full p-3 bg-red-500/10 dark:bg-red-900/20 rounded-lg">{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};