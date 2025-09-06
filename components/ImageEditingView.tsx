import React, { useState, useCallback, useRef } from 'react';
import { editImage, getImageDescription, getErrorMessage } from '../services/geminiService';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ImageIcon } from './icons/ImageIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { PlusIcon } from './icons/PlusIcon';
import { UserIcon } from './icons/UserIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-lg shadow-gray-200/30 dark:shadow-black/30 ${className}`}>
        {children}
    </div>
);

export const ImageEditingView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<{ file: File, base64: string, url: string } | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDescribing, setIsDescribing] = useState(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const promptFileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = event.target.files?.[0];
        if (file) {
            if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
                setError(`Format de fichier non supporté. Veuillez utiliser un fichier ${SUPPORTED_MIME_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')}.`);
                return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setError(`Le fichier est trop volumineux. La taille maximale est de ${MAX_FILE_SIZE_MB} Mo.`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setOriginalImage({
                    file: file,
                    base64: base64String,
                    url: URL.createObjectURL(file)
                });
                setEditedImage(null);
                setError(null);
                setPrompt('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePromptImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = event.target.files?.[0];
        if (file) {
            if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
                setError(`Format de fichier non supporté. Veuillez utiliser un fichier ${SUPPORTED_MIME_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')}.`);
                return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setError(`Le fichier est trop volumineux. La taille maximale est de ${MAX_FILE_SIZE_MB} Mo.`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                setIsGeneratingPrompt(true);
                setError(null);
                
                try {
                    const description = await getImageDescription({ data: base64String, mimeType: file.type });
                    setPrompt(description);
                    textareaRef.current?.focus();
                } catch (err) {
                    setError(getErrorMessage(err));
                } finally {
                    setIsGeneratingPrompt(false);
                    if (event.target) {
                        event.target.value = '';
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleEdit = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Veuillez fournir une instruction valide.");
            return;
        }
        if (!originalImage) {
            setError("Veuillez d'abord téléverser une image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const imageBase64 = await editImage(prompt, { data: originalImage.base64, mimeType: originalImage.file.type });
            setEditedImage(imageBase64);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, prompt]);

    const handleGetDescription = useCallback(async () => {
        if (!originalImage) {
            setError("Veuillez d'abord téléverser une image.");
            return;
        }
        setIsDescribing(true);
        setError(null);
        setPrompt('');

        try {
            const description = await getImageDescription({ data: originalImage.base64, mimeType: originalImage.file.type });
            setPrompt(description);
            textareaRef.current?.focus();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsDescribing(false);
        }
    }, [originalImage]);

    const setPromptTemplate = (template: string) => {
        setPrompt(template);
        textareaRef.current?.focus();
    };
    
    const handleCopyImage = async (base64Image: string | null) => {
        if (!base64Image) return;
        try {
            const blob = await (await fetch(`data:image/png;base64,${base64Image}`)).blob();
            await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
        } catch (err) {
            console.error("Failed to copy image: ", err);
            setError("Impossible de copier l'image dans le presse-papiers.");
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 gap-6 overflow-y-auto bg-transparent">
            <Card>
                <h2 className="text-2xl font-bold mb-4">Éditeur d'Images Magique</h2>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={SUPPORTED_MIME_TYPES.join(',')}
                />
                 <input
                    type="file"
                    ref={promptFileInputRef}
                    onChange={handlePromptImageUpload}
                    className="hidden"
                    accept={SUPPORTED_MIME_TYPES.join(',')}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-lg font-semibold text-gray-700 dark:text-gray-200"
                    data-tooltip="Téléverser une image depuis votre appareil"
                >
                    {originalImage ? 'Changer d\'image' : 'Téléverser une image pour commencer'}
                </button>

                {originalImage && (
                    <div className="mt-6 space-y-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-900/40 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">Boîte à outils IA</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cliquez sur un outil pour préparer une instruction, puis personnalisez-la ci-dessous.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                <ToolButton 
                                    icon={<SparklesIcon className="h-5 w-5"/>}
                                    label="Image en Texte"
                                    onClick={handleGetDescription}
                                    disabled={isLoading || isDescribing || isGeneratingPrompt}
                                    isLoading={isDescribing}
                                    tooltip="Générer une description de l'image originale"
                                />
                                <ToolButton 
                                    icon={<ScissorsIcon className="h-5 w-5"/>}
                                    label="Fond transparent"
                                    onClick={() => setPromptTemplate("Supprime l'arrière-plan, rends le nouveau fond transparent et net.")}
                                    disabled={isLoading || isDescribing || isGeneratingPrompt}
                                    tooltip="Utiliser un prompt pour rendre le fond transparent"
                                />
                                <ToolButton 
                                    icon={<ArrowUpRightIcon className="h-5 w-5"/>}
                                    label="Améliorer"
                                    onClick={() => setPromptTemplate("Augmente la résolution de l'image, améliore les détails et la netteté (Upscale).")}
                                    disabled={isLoading || isDescribing || isGeneratingPrompt}
                                    tooltip="Utiliser un prompt pour améliorer la qualité de l'image"
                                />
                                <ToolButton 
                                    icon={<UserIcon className="h-5 w-5"/>}
                                    label="Changer Vêtements"
                                    onClick={() => setPromptTemplate("Change les vêtements de la personne principale en [décrire les nouveaux vêtements].")}
                                    disabled={isLoading || isDescribing || isGeneratingPrompt}
                                    tooltip="Utiliser un prompt pour modifier les vêtements"
                                />
                                <ToolButton 
                                    icon={<PlusIcon className="h-5 w-5"/>}
                                    label="Ajouter Objet"
                                    onClick={() => setPromptTemplate("Ajoute un [décrire l'objet] de manière réaliste dans la scène.")}
                                    disabled={isLoading || isDescribing || isGeneratingPrompt}
                                    tooltip="Utiliser un prompt pour ajouter un objet"
                                />
                            </div>
                        </div>

                         <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="L'IA lira votre instruction ici... (ex: ajoute un palmier sur la droite)"
                                className="w-full h-24 p-3 pr-48 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                disabled={isLoading || isDescribing || isGeneratingPrompt}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    onClick={() => promptFileInputRef.current?.click()}
                                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Générer un prompt à partir d'une image"
                                    data-tooltip="Générer une description à partir d'une autre image"
                                    disabled={isLoading || isDescribing || isGeneratingPrompt}
                                >
                                    {isGeneratingPrompt ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 dark:border-white"></div>
                                    ) : (
                                        <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
                                    )}
                                </button>
                                <button
                                    onClick={handleEdit}
                                    disabled={isLoading || isDescribing || isGeneratingPrompt || !prompt.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-md font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:-translate-y-px active:scale-95"
                                    data-tooltip="Appliquer les modifications à l'image"
                                >
                                    <SparklesIcon className="h-5 w-5" />
                                    {isLoading ? 'Patienter...' : 'Modifier'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                 {error && <div className="text-red-600 dark:text-red-400 text-center mt-4 bg-red-500/10 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}
            </Card>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImagePanel title="Originale" imageSrc={originalImage?.url} />
                <ImagePanel 
                    title="Modifiée" 
                    imageSrc={editedImage ? `data:image/png;base64,${editedImage}` : null} 
                    isLoading={isLoading} 
                    downloadEnabled={!!editedImage} 
                    onCopy={() => handleCopyImage(editedImage)}
                />
            </div>
        </div>
    );
};

const ToolButton: React.FC<{icon: React.ReactNode, label: string, onClick: () => void, disabled: boolean, isLoading?: boolean, tooltip?: string}> = ({icon, label, onClick, disabled, isLoading, tooltip}) => (
    <button 
        onClick={onClick} 
        disabled={disabled} 
        className="w-full flex flex-col items-center justify-center text-center gap-2 px-2 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-150 transform hover:-translate-y-px active:scale-95 text-sm text-gray-700 dark:text-gray-200"
        data-tooltip={tooltip}
    >
        <div className="h-6 flex items-center justify-center">
        {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 dark:border-white"></div>
        ) : icon}
        </div>
        <span className="h-8 flex items-center">{label}</span>
    </button>
)

interface ImagePanelProps {
    title: string;
    imageSrc: string | null;
    isLoading?: boolean;
    downloadEnabled?: boolean;
    onCopy?: () => Promise<void>;
}

const ImagePanel: React.FC<ImagePanelProps> = ({ title, imageSrc, isLoading, downloadEnabled, onCopy }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyClick = async () => {
        if (!onCopy || isCopied) return;
        await onCopy();
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Card className="flex flex-col items-center justify-center p-4 min-h-[300px] md:min-h-0">
            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">{title}</h3>
            <div className="w-full h-full flex-1 bg-gray-100 dark:bg-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
                {isLoading ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                        <p>L'IA applique sa magie...</p>
                    </div>
                ) : imageSrc ? (
                    <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
                ) : (
                     <div className="text-center text-gray-400 dark:text-gray-500 p-4">
                        <ImageIcon className="h-20 w-20 mx-auto mb-4 opacity-50"/>
                        <p className="font-semibold text-lg">{title === 'Originale' ? 'Téléversez une image' : 'Le résultat apparaîtra ici'}</p>
                         <p className="text-sm mt-1">{title === 'Originale' ? 'Utilisez le bouton ci-dessus pour commencer.' : 'Appliquez une modification pour voir le résultat.'}</p>
                    </div>
                )}
                {downloadEnabled && imageSrc && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 text-white px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        {onCopy && (
                             <button onClick={handleCopyClick} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10" data-tooltip="Copier l'image">
                                {isCopied ? <CheckIcon className="h-5 w-5 text-green-400"/> : <ClipboardIcon className="h-5 w-5"/>}
                                <span className="hidden sm:inline">{isCopied ? 'Copié' : 'Copier'}</span>
                            </button>
                        )}
                        {onCopy && <div className="w-px h-5 bg-gray-500"></div>}
                        <a
                            href={imageSrc}
                            download={`prophete-developpeur-edited-${Date.now()}.png`}
                            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10"
                            data-tooltip="Télécharger l'image"
                        >
                            <DownloadIcon className="h-5 w-5"/>
                            <span className="hidden sm:inline">Télécharger</span>
                        </a>
                    </div>
                )}
            </div>
        </Card>
    );
}