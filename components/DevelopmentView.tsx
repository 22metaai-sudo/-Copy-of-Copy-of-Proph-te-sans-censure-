import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateProject, modifyProject, getErrorMessage } from '../services/geminiService';
import type { ProjectFile } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EyeIcon } from './icons/EyeIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { FolderOpenIcon } from './icons/FolderOpenIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { PencilIcon } from './icons/PencilIcon';
import { PlusIcon } from './icons/PlusIcon';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-lg shadow-gray-200/30 dark:shadow-black/30 ${className}`}>
        {children}
    </div>
);

const starterIdeas = [
    "Une simple page de portfolio avec HTML et CSS",
    "Une horloge analogique fonctionnelle avec JavaScript",
    "Une animation de chargement en CSS pur",
    "Un jeu de Tic-Tac-Toe de base"
];

const CodeEditor: React.FC<{ code: string; onCodeChange: (newCode: string) => void; fileName: string }> = ({ code, onCodeChange, fileName }) => {
    const lines = code.split('\n').length;
    const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    const lineCounterRef = useRef<HTMLPreElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleScroll = () => {
        if (lineCounterRef.current && textareaRef.current) {
            lineCounterRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };
    
    return (
        <div className="flex-1 flex bg-gray-100 dark:bg-gray-900/50 rounded-b-lg overflow-hidden">
            <pre ref={lineCounterRef} className="text-right p-4 text-gray-400 dark:text-gray-500 select-none font-mono text-sm leading-6 overflow-y-hidden bg-gray-200 dark:bg-gray-800/50">
                {lineNumbers}
            </pre>
            <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                onScroll={handleScroll}
                aria-label={`Éditeur de code pour ${fileName}`}
                className="flex-1 p-4 bg-transparent resize-none focus:outline-none font-mono text-sm leading-6 text-gray-800 dark:text-gray-200"
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
            />
        </div>
    );
};

const consoleLoggerScript = `
  <script>
    const formatArg = (arg) => {
      if (arg instanceof Error) {
        return arg.stack || arg.message;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Circular Object]';
        }
      }
      if (typeof arg === 'undefined') return 'undefined';
      return String(arg);
    };

    const postMessageToParent = (type, args) => {
      window.parent.postMessage({
        source: 'iframe-console',
        type: type,
        message: Array.from(args).map(formatArg).join(' '),
      }, '*');
    };

    const originalConsole = { ...console };
    console.log = (...args) => { originalConsole.log.apply(console, args); postMessageToParent('log', args); };
    console.error = (...args) => { originalConsole.error.apply(console, args); postMessageToParent('error', args); };
    console.warn = (...args) => { originalConsole.warn.apply(console, args); postMessageToParent('warn', args); };
    console.info = (...args) => { originalConsole.info.apply(console, args); postMessageToParent('info', args); };

    window.addEventListener('error', event => {
      postMessageToParent('error', [event.message, 'at', event.filename + ':' + event.lineno]);
      originalConsole.error('Uncaught Error:', event);
    });
    
    window.addEventListener('unhandledrejection', event => {
      postMessageToParent('error', ['Unhandled promise rejection:', event.reason]);
      originalConsole.error('Unhandled promise rejection:', event);
    });
  </script>
`;

interface ConsoleMessage {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
    timestamp: Date;
}

export const DevelopmentView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [debouncedFiles, setDebouncedFiles] = useState<ProjectFile[]>([]);
    const [activeFileName, setActiveFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isModifying, setIsModifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [missingFiles, setMissingFiles] = useState<string[]>([]);
    const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
    const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'console'>('preview');
    const [dividerPosition, setDividerPosition] = useState(50);
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const activeFile = files.find(f => f.fileName === activeFileName);

    const onMouseDown = (e: React.MouseEvent) => { isDragging.current = true; e.preventDefault(); };
    const onMouseUp = useCallback(() => { isDragging.current = false; }, []);
    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const bounds = containerRef.current.getBoundingClientRect();
        const newPos = ((e.clientX - bounds.left) / bounds.width) * 100;
        if (newPos > 20 && newPos < 80) setDividerPosition(newPos);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);
    
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedFiles(files), 750);
        return () => clearTimeout(handler);
    }, [files]);

    useEffect(() => {
        if (debouncedFiles.length === 0) {
            if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
            setMissingFiles([]);
            return;
        }

        setConsoleMessages([]);
        const indexHtmlFile = debouncedFiles.find(f => f.fileName.toLowerCase() === 'index.html');
        if (!indexHtmlFile) {
            setMissingFiles(['index.html']);
            if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
            return;
        }

        let htmlContent = indexHtmlFile.code;
        const foundMissingFiles: string[] = [];
        const inlineAssets = (content: string, regex: RegExp, wrapper: (code: string) => string) => {
            return content.replace(regex, (match, href) => {
                const assetFile = debouncedFiles.find(f => f.fileName === href);
                if (assetFile) return wrapper(assetFile.code);
                foundMissingFiles.push(href);
                return `<!-- Asset not found: ${href} -->`;
            });
        };
        
        htmlContent = inlineAssets(htmlContent, /<link\s+.*?href=["'](.*?\.css)["'].*?>/g, code => `<style>${code}</style>`);
        htmlContent = inlineAssets(htmlContent, /<script\s+.*?src=["'](.*?\.js)["'].*?><\/script>/g, code => `<script>${code}</script>`);
        htmlContent = htmlContent.replace('</head>', `${consoleLoggerScript}</head>`);
        setMissingFiles(foundMissingFiles);

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const newUrl = URL.createObjectURL(blob);
        
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(newUrl);

    }, [debouncedFiles]);
    
    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.source === 'iframe-console') {
                setConsoleMessages(prev => [...prev, {
                    type: event.data.type, message: event.data.message, timestamp: new Date()
                }]);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleApiCall = async (apiFunc: () => Promise<ProjectFile[]>) => {
        setError(null); setIsLoading(true);
        try {
            const newFiles = await apiFunc();
            if (newFiles.length === 0) {
                setError("L'IA n'a retourné aucun fichier. Essayez d'être plus précis."); setFiles([]); setActiveFileName(null);
            } else {
                setFiles(newFiles);
                const indexFile = newFiles.find(f => f.fileName.toLowerCase() === 'index.html');
                setActiveFileName(indexFile ? indexFile.fileName : newFiles[0].fileName);
                setActivePreviewTab('preview');
            }
        } catch (err) { setError(getErrorMessage(err));
        } finally { setIsLoading(false); setIsModifying(false); }
    };
    
    const handleGenerate = () => { if (!prompt.trim()) { setError("Veuillez entrer une description de projet."); return; } setFiles([]); handleApiCall(() => generateProject(prompt)); };
    const handleModify = () => { if (!prompt.trim()) { setError("Veuillez décrire la modification à apporter."); return; } if (files.length === 0) { setError("Aucun projet à modifier."); return; } setIsModifying(true); handleApiCall(() => modifyProject(files, prompt, activeFileName)); };
    const handleSubmit = () => { if (files.length > 0) handleModify(); else handleGenerate(); };
    const handleCodeChange = (newCode: string) => { if (!activeFileName) return; setFiles(currentFiles => currentFiles.map(file => file.fileName === activeFileName ? { ...file, code: newCode } : file)); };
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files; if (!selectedFiles || selectedFiles.length === 0) return;
        setError(null); setIsLoading(true);
        const filePromises = Array.from(selectedFiles).map(file => new Promise<ProjectFile>((resolve, reject) => {
            const reader = new FileReader(); reader.onload = () => resolve({ fileName: file.name, code: reader.result as string }); reader.onerror = reject; reader.readAsText(file);
        }));
        Promise.all(filePromises).then(projectFiles => {
            setFiles(projectFiles); const indexFile = projectFiles.find(f => f.fileName.toLowerCase() === 'index.html'); setActiveFileName(indexFile ? indexFile.fileName : projectFiles[0]?.fileName || null);
        }).catch(err => { console.error("Error reading files:", err); setError("Une erreur est survenue lors de la lecture des fichiers.");
        }).finally(() => { setIsLoading(false); if (event.target) event.target.value = ''; });
    };
     const handleFolderImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;
        setError(null);
        setIsLoading(true);

        let commonPath = '';
        if (selectedFiles.length > 0) {
            const firstPath = (selectedFiles[0] as any).webkitRelativePath;
            if (firstPath && firstPath.includes('/')) {
                commonPath = firstPath.substring(0, firstPath.indexOf('/') + 1);
            }
        }

        const filePromises = Array.from(selectedFiles).map(file => new Promise<ProjectFile | null>((resolve) => {
            if (file.name.startsWith('.') || (!file.type && file.size === 0)) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                let fileName = (file as any).webkitRelativePath || file.name;
                if (commonPath && fileName.startsWith(commonPath)) {
                    fileName = fileName.substring(commonPath.length);
                }
                if (fileName) {
                    resolve({ fileName, code: reader.result as string });
                } else {
                    resolve(null);
                }
            };
            reader.onerror = () => {
                resolve(null);
            };
            reader.readAsText(file);
        }));

        Promise.all(filePromises).then(results => {
            const projectFiles = results.filter(Boolean) as ProjectFile[];
            
            if (projectFiles.length === 0) {
                setError("Aucun fichier lisible n'a été trouvé dans le dossier sélectionné.");
                setFiles([]);
                setActiveFileName(null);
                return;
            }

            setFiles(projectFiles);
            const indexFile = projectFiles.find(f => f.fileName.endsWith('index.html'));
            setActiveFileName(indexFile ? indexFile.fileName : (projectFiles[0]?.fileName || null));
        }).catch(err => {
            console.error("Error processing files:", err);
            setError("Une erreur est survenue lors de la lecture des fichiers du dossier.");
        }).finally(() => {
            setIsLoading(false);
            if (event.target) event.target.value = '';
        });
    };
    const handleClearProject = () => { if (window.confirm("Êtes-vous sûr de vouloir effacer le projet actuel ?")) { setFiles([]); setPrompt(''); setActiveFileName(null); setPreviewUrl(null); setError(null); } };
    const getConsoleLineColor = (type: ConsoleMessage['type']) => ({'error': 'text-red-500 dark:text-red-400','warn': 'text-amber-500 dark:text-amber-400','info': 'text-blue-500 dark:text-blue-400'} as const)[type] || 'text-gray-700 dark:text-gray-300';
    
    const handleNewFile = () => {
        const fileName = window.prompt("Entrez le nom du nouveau fichier (ex: script.js):");
        if (!fileName || fileName.trim() === '') return;
        if (files.some(f => f.fileName.toLowerCase() === fileName.toLowerCase())) { alert("Un fichier avec ce nom existe déjà."); return; }
        const newFile: ProjectFile = { fileName, code: '' };
        setFiles(prev => [...prev, newFile]); setActiveFileName(fileName);
    };
    const handleRenameFile = (oldFileName: string) => {
        const newFileName = window.prompt(`Renommer "${oldFileName}":`, oldFileName);
        if (!newFileName || newFileName.trim() === '' || newFileName === oldFileName) return;
        if (files.some(f => f.fileName.toLowerCase() === newFileName.toLowerCase())) { alert("Un fichier avec ce nom existe déjà."); return; }
        setFiles(prev => prev.map(f => f.fileName === oldFileName ? { ...f, fileName: newFileName } : f));
        setActiveFileName(newFileName);
    };
    const handleDeleteFile = (fileNameToDelete: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${fileNameToDelete}" ?`)) return;
        const newFiles = files.filter(f => f.fileName !== fileNameToDelete); setFiles(newFiles);
        if (activeFileName === fileNameToDelete) {
            if (newFiles.length > 0) {
                const indexFile = newFiles.find(f => f.fileName.toLowerCase() === 'index.html');
                setActiveFileName(indexFile ? indexFile.fileName : newFiles[0].fileName);
            } else { setActiveFileName(null); }
        }
    };

    return (
        <div ref={containerRef} className="flex-1 grid grid-cols-[var(--divider-position)_auto_1fr] gap-0 p-4 sm:p-6 overflow-hidden bg-transparent h-full" style={{ '--divider-position': `${dividerPosition}%` } as React.CSSProperties}>
            {/* Left Column: Controls & Editor */}
            <div id="editor-panel" className="flex flex-col gap-6 overflow-y-auto pr-3 -mr-3">
                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><CodeBracketIcon className="h-7 w-7"/> Constructeur de Projets</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{files.length > 0 ? "Décrivez les modifications à apporter au projet actuel." : "Décrivez le projet à créer, ou importez des fichiers."}</p>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} aria-label="Description du projet ou des modifications" placeholder="Ex: Crée un site de portfolio simple avec une section 'À propos' et une galerie..." className="w-full h-28 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-4" disabled={isLoading}/>
                    {files.length === 0 && (<div className="mb-4"><h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Idées de départ :</h3><div className="grid grid-cols-2 gap-2">{starterIdeas.map(idea => (<button key={idea} onClick={() => setPrompt(idea)} className="text-sm text-left p-2 bg-gray-200 dark:bg-gray-700/60 hover:bg-gray-300 dark:hover:bg-gray-600/60 rounded-md transition-colors">{idea}</button>))}</div></div>)}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleSubmit} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg transform hover:-translate-y-px"><SparklesIcon className="h-6 w-6" />{files.length > 0 ? (isModifying ? 'Modification...' : 'Modifier') : 'Générer'}</button>
                        <div className="flex gap-3">
                            <input type="file" multiple ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.md,.txt"/>
                            <input type="file" {...{ webkitdirectory: "", directory: "" }} multiple ref={folderInputRef} onChange={handleFolderImport} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-gray-400" aria-label="Importer des fichiers locaux">
                                <ArrowUpTrayIcon className="h-5 w-5" />
                                <span className="sm:inline">Fichiers</span>
                            </button>
                             <button onClick={() => folderInputRef.current?.click()} disabled={isLoading} className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-gray-400" aria-label="Importer un dossier local">
                                <FolderOpenIcon className="h-5 w-5" />
                                <span className="sm:inline">Dossier</span>
                            </button>
                            {files.length > 0 && (
                                <button onClick={handleClearProject} disabled={isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label="Effacer le projet actuel">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </Card>
                {isLoading && files.length === 0 && (<Card className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400 mx-auto mb-4"></div><p className="font-semibold">L'IA construit votre projet...</p><p className="text-sm">Cela peut prendre un moment.</p></Card>)}
                {files.length > 0 && (<Card className="flex-1 flex flex-col min-h-[400px] p-0"><div className="p-2 border-b border-gray-200 dark:border-gray-700/60 flex items-center justify-between gap-2"><div className="flex items-center gap-3 shrink-0"><FolderOpenIcon className="h-6 w-6 text-gray-500 dark:text-gray-400"/> <h3 className="text-lg font-bold">Fichiers du Projet</h3></div>{activeFile && (<div className="flex items-center gap-2 shrink-0"><button onClick={() => handleRenameFile(activeFile.fileName)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Renommer le fichier actif"><PencilIcon className="h-4 w-4"/></button><button onClick={() => handleDeleteFile(activeFile.fileName)} className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500" aria-label="Supprimer le fichier actif"><TrashIcon className="h-4 w-4"/></button></div>)}</div><div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-900/50 overflow-x-auto border-b border-gray-200 dark:border-gray-700/60">{files.map(file => (<button key={file.fileName} onClick={() => setActiveFileName(file.fileName)} className={`flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 ${activeFileName === file.fileName ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/60 dark:hover:bg-gray-800/60'}`}><DocumentTextIcon className="h-5 w-5"/>{file.fileName}</button>))} <button onClick={handleNewFile} className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700/80 dark:hover:bg-gray-700" aria-label="Nouveau fichier"><PlusIcon className="h-5 w-5"/>Nouveau</button></div><div className="flex-1 flex flex-col relative">{activeFile ? (<CodeEditor code={activeFile.code} onCodeChange={handleCodeChange} fileName={activeFile.fileName} />) : (<div className="flex-1 flex items-center justify-center text-gray-500">Sélectionnez un fichier pour le modifier.</div>)}</div></Card>)}
            </div>
            {/* Resizer */}
            <div onMouseDown={onMouseDown} className="flex items-center justify-center cursor-col-resize group w-2.5" role="separator" aria-orientation="vertical" aria-controls="editor-panel preview-panel-container" aria-valuenow={dividerPosition}><div className="w-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-indigo-500 transition-colors"></div></div>
            {/* Right Column: Preview */}
            <div id="preview-panel-container" className="flex flex-col h-full overflow-hidden pl-3 -ml-3"><Card className="flex-1 flex flex-col p-0"><div className="p-2 border-b border-gray-200 dark:border-gray-700/60 flex items-center justify-between"><div role="tablist" aria-label="Panneaux de sortie" className="flex items-center gap-1"><button id="preview-tab" role="tab" aria-controls="preview-panel" aria-selected={activePreviewTab === 'preview'} onClick={() => setActivePreviewTab('preview')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activePreviewTab === 'preview' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}><EyeIcon className="h-5 w-5"/> Aperçu</button><button id="console-tab" role="tab" aria-controls="console-panel" aria-selected={activePreviewTab === 'console'} onClick={() => setActivePreviewTab('console')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activePreviewTab === 'console' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}><TerminalIcon className="h-5 w-5"/> Console {consoleMessages.length > 0 && <span className="text-xs bg-indigo-500 text-white rounded-full px-1.5 py-0.5">{consoleMessages.length}</span>}</button></div><div className="flex items-center gap-2"><button onClick={() => setDebouncedFiles([...files])} disabled={!previewUrl} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50" aria-label="Rafraîchir l'aperçu"><ArrowPathIcon className="h-5 w-5"/></button><a href={previewUrl || '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${!previewUrl ? 'opacity-50 pointer-events-none' : ''}`} aria-label="Ouvrir l'aperçu dans un nouvel onglet"><ArrowUpRightIcon className="h-5 w-5"/></a></div></div>{missingFiles.length > 0 && (<div className="p-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 flex items-center gap-2"><InformationCircleIcon className="h-4 w-4 shrink-0"/><span><strong>Attention:</strong> {missingFiles.length > 1 ? "Fichiers liés non trouvés" : "Fichier lié non trouvé"}: {missingFiles.join(', ')}</span></div>)}<div className="flex-1 bg-white dark:bg-gray-900/50 rounded-b-lg relative overflow-hidden">{(isLoading && isModifying) && (<div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20 animate-fade-in"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>Modification en cours...</div>)}<div id="preview-panel" role="tabpanel" aria-labelledby="preview-tab" className={`w-full h-full ${activePreviewTab === 'preview' ? 'block' : 'hidden'}`}>{previewUrl ? (<iframe key={previewUrl} src={previewUrl} title="Project Preview" className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin"/>) : (<div className="w-full h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">{ !(isLoading && files.length === 0) && <div><CodeBracketIcon className="h-20 w-20 mx-auto mb-4 opacity-50"/><p className="font-semibold text-lg">L'aperçu de votre projet apparaîtra ici</p></div>}</div>)}</div><div id="console-panel" role="tabpanel" aria-labelledby="console-tab" className={`w-full h-full flex flex-col ${activePreviewTab === 'console' ? 'flex' : 'hidden'}`}><div className="flex-1 p-2 overflow-y-auto font-mono text-xs bg-gray-100 dark:bg-gray-900">{consoleMessages.length > 0 ? consoleMessages.map((msg, i) => (<div key={i} className={`flex gap-2 items-start p-1 border-b border-gray-200 dark:border-gray-800 ${getConsoleLineColor(msg.type)}`}><span className="text-gray-400 select-none">{msg.timestamp.toLocaleTimeString()}</span><pre className="whitespace-pre-wrap break-words">{msg.message}</pre></div>)) : <div className="p-4 text-gray-500">La console est vide. Les messages de `console.log()` apparaîtront ici.</div>}</div><div className="p-1 border-t border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 flex items-center justify-between"><button onClick={() => setConsoleMessages([])} className="text-xs px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Vider la console</button></div></div></div></Card></div>{error && (<div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 p-4 max-w-md w-full bg-red-500/20 dark:bg-red-900/40 border border-red-500/30 text-red-800 dark:text-red-200 rounded-lg shadow-lg animate-slide-fade-in" role="alert"><div className="flex justify-between items-start"><div className="flex-1"><p className="font-bold">Erreur</p><p className="text-sm">{error}</p></div><button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-red-500/20 -mt-1 -mr-1">&times;</button></div></div>)}</div>
    );
};