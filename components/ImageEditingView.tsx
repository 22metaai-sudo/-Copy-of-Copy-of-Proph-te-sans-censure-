import React, { useState, useCallback, useRef, useEffect } from 'react';
import { editImage, getImageDescription, getErrorMessage } from '../services/geminiService';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ImageIcon } from './icons/ImageIcon';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { BrushIcon } from './icons/BrushIcon';
import { TrashIcon } from './icons/TrashIcon';

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface HistoryItem {
    base64: string;
    prompt?: string;
    mimeType: string;
}

interface MaskingCanvasProps {
    imageSrc: string;
    brushSize: number;
    isErasing: boolean;
    onMaskChange: (maskBase64: string | null) => void;
    width: number;
    height: number;
    keyId: string; // Used to force re-render
}

const MaskingCanvas: React.FC<MaskingCanvasProps> = ({ imageSrc, brushSize, isErasing, onMaskChange, width, height, keyId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Clear canvas on new image or tool change
                ctx.clearRect(0, 0, width, height);
                onMaskChange(null);
            }
        }
    }, [keyId, width, height, onMaskChange]);


    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: (clientX - rect.left) * (width / rect.width),
            y: (clientY - rect.top) * (height / rect.height)
        };
    };
    
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoords(e);
        if (!coords) return;
        isDrawing.current = true;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        const coords = getCoords(e);
        if (!coords) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
        ctx.strokeStyle = 'rgba(255,255,255,1)';
        
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        const canvas = canvasRef.current;
        if (canvas) {
            onMaskChange(canvas.toDataURL('image/png'));
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair opacity-50"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
    );
};


export const ImageEditingView: React.FC<{initialImageBase64?: string | null, onDone: () => void}> = ({ initialImageBase64, onDone }) => {
    const [prompt, setPrompt] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mask, setMask] = useState<string | null>(null);
    const [isMasking, setIsMasking] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [isErasing, setIsErasing] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 512, height: 512 });

    const activeItem = activeIndex >= 0 && activeIndex < history.length ? history[activeIndex] : null;

    useEffect(() => {
        if (initialImageBase64) {
             const newHistoryItem: HistoryItem = { base64: initialImageBase64, mimeType: 'image/png' };
             setHistory([newHistoryItem]);
             setActiveIndex(0);
             onDone(); // Clear the prop in App state
        }
    }, [initialImageBase64, onDone]);

    useEffect(() => {
        if (activeItem?.base64) {
            const img = new Image();
            img.src = `data:${activeItem.mimeType};base64,${activeItem.base64}`;
            img.onload = () => {
                setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            }
        }
    }, [activeItem]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = event.target.files?.[0];
        if (file) {
            if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
                setError(`Format non supporté.`);
                return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setError(`Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} Mo).`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                // Fix: The 'file' property does not exist on type 'HistoryItem'.
                const newHistoryItem: HistoryItem = { base64: base64String, mimeType: file.type };
                setHistory([newHistoryItem]);
                setActiveIndex(0);
                setError(null);
                setPrompt('');
                setIsMasking(false);
                setMask(null);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleEdit = useCallback(async () => {
        if (!prompt.trim()) { setError("Veuillez fournir une instruction."); return; }
        if (!activeItem) { setError("Veuillez sélectionner une image."); return; }

        setIsLoading(true);
        setError(null);
        
        let imageToSend = activeItem;

        // If masking, prepare the image with transparency
        if (isMasking && mask) {
            const baseImage = new Image();
            baseImage.src = `data:${activeItem.mimeType};base64,${activeItem.base64}`;
            await new Promise(resolve => baseImage.onload = resolve);

            const maskImage = new Image();
            maskImage.src = mask;
            await new Promise(resolve => maskImage.onload = resolve);
            
            const canvas = document.createElement('canvas');
            canvas.width = baseImage.naturalWidth;
            canvas.height = baseImage.naturalHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(baseImage, 0, 0);
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(maskImage, 0, 0);
                
                const maskedBase64 = canvas.toDataURL('image/png').split(',')[1];
                imageToSend = { base64: maskedBase64, mimeType: 'image/png' };
            }
        }

        try {
            const finalPrompt = isMasking 
                ? `En te basant sur l'image fournie, remplis la zone transparente en suivant cette instruction : "${prompt}". Le reste de l'image doit rester identique.`
                : prompt;

            const imageBase64 = await editImage(finalPrompt, { data: imageToSend.base64, mimeType: imageToSend.mimeType });
            
            const newHistoryItem: HistoryItem = { base64: imageBase64, mimeType: 'image/png', prompt: prompt };
            const newHistory = history.slice(0, activeIndex + 1);
            newHistory.push(newHistoryItem);
            
            setHistory(newHistory);
            setActiveIndex(newHistory.length - 1);
            setMask(null);
            setIsMasking(false);

        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [activeItem, prompt, history, activeIndex, isMasking, mask]);

    return (
        <div className="flex-1 flex h-full overflow-hidden">
            {/* History Panel */}
            <aside className="w-48 p-4 border-r border-gray-200 dark:border-gray-700/60 overflow-y-auto bg-white/50 dark:bg-gray-800/50">
                <h3 className="text-lg font-bold mb-4">Historique</h3>
                <div className="space-y-3">
                    {history.map((item, index) => (
                        <button key={index} onClick={() => setActiveIndex(index)} className={`w-full rounded-lg overflow-hidden border-2 transition ${activeIndex === index ? 'border-indigo-500 shadow-md' : 'border-transparent hover:border-gray-400'}`}>
                            <img src={`data:${item.mimeType};base64,${item.base64}`} alt={`Version ${index}`} className="w-full h-auto object-cover" />
                            <div className={`p-1 text-xs font-semibold ${activeIndex === index ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                {index === 0 ? 'Original' : `Étape ${index}`}
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
                <div className="w-full h-full bg-gray-100 dark:bg-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {isLoading && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div><p className="mt-4">Modification en cours...</p></div>}
                    {!activeItem && (
                        <div className="text-center text-gray-400 dark:text-gray-500 p-4">
                            <ImageIcon className="h-20 w-20 mx-auto mb-4 opacity-50"/>
                            <p className="font-semibold text-lg">Téléversez une image</p>
                            <p className="text-sm">Utilisez les outils sur la droite pour commencer.</p>
                        </div>
                    )}
                    {activeItem && (
                        <div className="relative w-full h-full flex items-center justify-center">
                             <img 
                                src={`data:${activeItem.mimeType};base64,${activeItem.base64}`} 
                                alt={`Version ${activeIndex}`} 
                                className="max-w-full max-h-full object-contain"
                            />
                            {isMasking && (
                                <MaskingCanvas 
                                    keyId={`${activeIndex}-${isErasing}`}
                                    imageSrc={`data:${activeItem.mimeType};base64,${activeItem.base64}`}
                                    brushSize={brushSize}
                                    isErasing={isErasing}
                                    onMaskChange={setMask}
                                    width={imageDimensions.width}
                                    height={imageDimensions.height}
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
            
            {/* Controls Panel */}
            <aside className="w-96 p-4 border-l border-gray-200 dark:border-gray-700/60 flex flex-col gap-4 bg-white/50 dark:bg-gray-800/50 overflow-y-auto">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={SUPPORTED_MIME_TYPES.join(',')}/>
                 <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold">
                    <ArrowUpTrayIcon className="h-6 w-6" />
                    {history.length > 0 ? 'Changer d\'image' : 'Téléverser une image'}
                 </button>

                 {history.length > 0 && (
                    <>
                        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900/40">
                            <h3 className="font-semibold mb-3 flex items-center gap-2"><BrushIcon className="h-5 w-5"/> Outil Masque (Bêta)</h3>
                            <button onClick={() => setIsMasking(!isMasking)} className={`w-full py-2 rounded-md font-semibold text-sm mb-3 ${isMasking ? 'bg-indigo-600 text-white' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                {isMasking ? 'Masque Activé' : 'Activer le Masque'}
                            </button>
                            {isMasking && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-around">
                                        <button onClick={() => setIsErasing(false)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${!isErasing ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-200 dark:bg-gray-600'}`}>Dessiner</button>
                                        <button onClick={() => setIsErasing(true)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${isErasing ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-200 dark:bg-gray-600'}`}>Gommer</button>
                                    </div>
                                    <div>
                                        <label htmlFor="brush-size" className="block text-sm font-medium mb-1">Taille</label>
                                        <input type="range" id="brush-size" min="5" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full"/>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="font-semibold block mb-2">Instruction de modification</label>
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder={isMasking ? "Décrivez ce qu'il faut faire dans la zone masquée..." : "Change la couleur du ciel en orange..."}
                                className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <button onClick={() => setPrompt("Échange les visages des deux personnes de manière réaliste (faceswap).")} className="w-full text-left text-xs p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Suggestion: Face Swap</button>
                             <button onClick={() => setPrompt("Supprime l'arrière-plan et rends-le transparent.")} className="w-full text-left text-xs p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Suggestion: Fond Transparent</button>
                        </div>

                        <button
                            onClick={handleEdit}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-indigo-700 transition-all shadow-md text-lg"
                        >
                            <SparklesIcon className="h-6 w-6" />
                            {isLoading ? 'Patienter...' : 'Modifier'}
                        </button>
                        <a
                            href={activeItem ? `data:${activeItem.mimeType};base64,${activeItem.base64}` : '#'}
                            download={activeItem ? `prophete-edit-${activeIndex}-${Date.now()}.png` : undefined}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md mt-2 ${!activeItem || isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                            aria-disabled={!activeItem || isLoading}
                        >
                            <DownloadIcon className="h-6 w-6" />
                            Télécharger
                        </a>
                    </>
                 )}
                 {error && <div className="text-red-600 dark:text-red-400 text-center mt-2 p-3 bg-red-500/10 rounded-lg">{error}</div>}
            </aside>
        </div>
    );
};