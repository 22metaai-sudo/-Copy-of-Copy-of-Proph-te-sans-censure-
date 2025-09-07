import React, { useState, useCallback } from 'react';
import { generateImage, getErrorMessage, getImageDescription } from '../services/geminiService';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ImageIcon } from './icons/ImageIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface HistoryItem {
    prompt: string;
    images: string[]; // Store multiple images for batch generation
    aspectRatio: string;
}

export const ImageGenerationView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [numImages, setNumImages] = useState(1);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeImage, setActiveImage] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Veuillez entrer une description pour l'image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        setActiveImage(null);

        try {
            // The API generates one image at a time, so we loop.
            const imagePromises = Array.from({ length: numImages }).map(() => 
                generateImage(prompt, aspectRatio)
            );
            const imagesBase64 = await Promise.all(imagePromises);

            setGeneratedImages(imagesBase64);
            setActiveImage(imagesBase64[0]);
            setHistory(prev => [{ prompt, images: imagesBase64, aspectRatio }, ...prev]);

        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [prompt, aspectRatio, numImages]);

    const handleHistoryClick = (item: HistoryItem, image: string) => {
        setPrompt(item.prompt);
        setAspectRatio(item.aspectRatio);
        setGeneratedImages(item.images);
        setActiveImage(image);
    };

    const handleUseAsPrompt = async (imageBase64: string) => {
        if (!imageBase64) return;
        setIsLoading(true); // Use main loading state
        setError(null);
        try {
            const description = await getImageDescription({ data: imageBase64, mimeType: 'image/png' });
            setPrompt(description);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex h-full overflow-hidden">
            {/* Left Panel: Controls */}
            <div className="w-full lg:w-1/2 xl:w-5/12 p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto">
                <div className="bg-white/70 dark:bg-gray-800/60 p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/60">
                    <h2 className="text-2xl font-bold mb-4">Créateur de Visions</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Décrivez l'image que vous souhaitez créer.</p>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ex: Un colibri aux couleurs vives buvant le nectar d'un hibiscus..."
                        className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-4"
                    />
                    
                    <h3 className="text-lg font-semibold mb-3">Format</h3>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                        {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`py-2 rounded-lg transition-colors text-sm font-semibold ${aspectRatio === ratio ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                {ratio}
                            </button>
                        ))}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-3">Nombre d'images</h3>
                    <div className="flex items-center gap-4 mb-6">
                        <input
                            type="range"
                            min="1"
                            max="4"
                            value={numImages}
                            onChange={(e) => setNumImages(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg w-8 text-center">{numImages}</span>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-indigo-700 transition-all shadow-md text-lg"
                    >
                        <SparklesIcon className="h-6 w-6" />
                        {isLoading ? `Génération (${numImages})...` : `Générer ${numImages} Image${numImages > 1 ? 's' : ''}`}
                    </button>
                     {error && <div className="text-red-600 dark:text-red-400 text-center mt-4 w-full p-3 bg-red-500/10 rounded-lg">{error}</div>}
                </div>
            </div>

            {/* Middle Panel: Image Display */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col">
                <div className="bg-white/70 dark:bg-gray-800/60 rounded-xl border border-gray-200/80 dark:border-gray-700/60 flex flex-col items-center justify-center p-4 h-full">
                    <div className="w-full h-full flex-1 bg-gray-100 dark:bg-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
                        {isLoading && (
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                                <p>L'IA imagine votre création...</p>
                            </div>
                        )}
                        {!isLoading && activeImage && (
                            <>
                                <img src={`data:image/png;base64,${activeImage}`} alt="Generated art" className="w-full h-full object-contain" />
                                <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <a
                                        href={`data:image/png;base64,${activeImage}`}
                                        download={`prophete-generation-${prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_') || Date.now()}.png`}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                                    >
                                        <DownloadIcon className="h-5 w-5" />
                                        Télécharger
                                    </a>
                                </div>
                            </>
                        )}
                        {!isLoading && !activeImage && (
                            <div className="text-center text-gray-400 dark:text-gray-500 p-4">
                                <ImageIcon className="h-20 w-20 mx-auto mb-4 opacity-50"/>
                                <p className="font-semibold text-lg">Votre image apparaîtra ici</p>
                            </div>
                        )}
                    </div>
                     {generatedImages.length > 1 && (
                        <div className="w-full pt-4">
                            <h3 className="text-sm font-semibold mb-2">Variations</h3>
                            <div className="grid grid-cols-4 gap-2">
                            {generatedImages.map((img, index) => (
                                <button key={index} onClick={() => setActiveImage(img)} className={`rounded-lg overflow-hidden border-2 transition ${activeImage === img ? 'border-indigo-500' : 'border-transparent hover:border-gray-400'}`}>
                                    <img src={`data:image/png;base64,${img}`} alt={`Variation ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Right Panel: History */}
            <aside className="w-64 p-4 sm:p-6 border-l border-gray-200 dark:border-gray-700/60 overflow-y-auto bg-white/50 dark:bg-gray-800/50">
                <h3 className="text-xl font-bold mb-4">Historique</h3>
                <div className="space-y-4">
                    {history.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Vos générations récentes apparaîtront ici.</p>}
                    {history.map((item, index) => (
                        <div key={index}>
                             <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2" title={item.prompt}>{item.prompt}</p>
                             <div className="grid grid-cols-2 gap-2">
                                {item.images.map((img, imgIndex) => (
                                     <button key={imgIndex} onClick={() => handleHistoryClick(item, img)} className="rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 hover:opacity-80 transition">
                                        <img src={`data:image/png;base64,${img}`} alt={`History image ${index}-${imgIndex}`} className="w-full h-full object-cover"/>
                                    </button>
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
};