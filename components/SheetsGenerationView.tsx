import React, { useState, useCallback } from 'react';
import { generateSheet, SheetData, getErrorMessage } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { SheetsIcon } from './icons/SheetsIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-lg shadow-gray-200/30 dark:shadow-black/30 ${className}`}>
        {children}
    </div>
);


export const SheetsGenerationView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sheetData, setSheetData] = useState<SheetData | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) {
            setError("Veuillez entrer un sujet pour la feuille de calcul.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSheetData(null);

        try {
            const data = await generateSheet(topic);
            setSheetData(data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [topic]);

    const convertToCSV = (data: SheetData) => {
        const header = data.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
        const rows = data.rows.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        );
        return [header, ...rows].join('\n');
    };

    const handleDownloadCSV = () => {
        if (!sheetData) return;
        const csv = convertToCSV(sheetData);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `feuille-de-calcul-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleCopyCSV = () => {
        if (!sheetData || isCopied) return;
        const csv = convertToCSV(sheetData);
        navigator.clipboard.writeText(csv).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy CSV: ", err);
            setError("Impossible de copier les données CSV.");
        });
    };

    const handleDownloadJSON = () => {
        if (!sheetData) return;
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sheetData, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `feuille-de-calcul-${Date.now()}.json`;
        link.click();
    };

    return (
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto bg-transparent">
            <div className="w-full max-w-6xl flex flex-col gap-6">
                <Card>
                    <h2 className="text-2xl font-bold mb-4">Générateur de Feuilles IA</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Décrivez les données que vous souhaitez structurer, et l'IA créera un tableau pour vous.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="Ex: Les 10 plus grandes villes de la Caraïbe avec leur population et pays"
                            className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg transform hover:-translate-y-px"
                        >
                            <SparklesIcon className="h-6 w-6" />
                            {isLoading ? 'Génération...' : 'Générer'}
                        </button>
                    </div>
                </Card>

                <Card className="flex flex-col p-4 min-h-[50vh]">
                     {isLoading && (
                        <div className="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                            <div>
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400 mx-auto mb-4"></div>
                                <p>L'IA structure vos données...</p>
                            </div>
                        </div>
                    )}
                    {!isLoading && sheetData && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-end flex-wrap gap-2 mb-4 shrink-0">
                                <button onClick={handleCopyCSV} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
                                    {isCopied ? <CheckIcon className="h-5 w-5 text-green-500"/> : <ClipboardIcon className="h-5 w-5"/>}
                                    {isCopied ? 'Copié' : 'Copier CSV'}
                                </button>
                                <button onClick={handleDownloadJSON} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
                                    <DownloadIcon className="h-5 w-5"/>
                                    JSON
                                </button>
                                <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors text-white font-semibold shadow-sm">
                                    <DownloadIcon className="h-5 w-5"/>
                                    Télécharger en CSV
                                </button>
                            </div>
                            <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 flex-1">
                                <table className="w-full text-sm text-left text-gray-800 dark:text-gray-300">
                                    <thead className="text-xs text-gray-700 dark:text-gray-200 uppercase bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm sticky top-0 z-10">
                                        <tr>
                                            {sheetData.headers.map((header, i) => (
                                                <th key={i} scope="col" className="px-6 py-3 whitespace-nowrap">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {sheetData.rows.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/60 even:bg-gray-50/50 dark:even:bg-gray-800/50 transition-colors duration-150">
                                                {row.map((cell, j) => (
                                                    <td key={j} className="px-6 py-4 whitespace-nowrap">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {!isLoading && !sheetData && (
                        <div className="flex-1 flex items-center justify-center text-center text-gray-400 dark:text-gray-500 p-4">
                            <div>
                                <SheetsIcon className="h-20 w-20 mx-auto mb-4 opacity-50"/>
                                <p className="font-semibold text-lg">Votre feuille de calcul apparaîtra ici</p>
                            </div>
                        </div>
                    )}
                    {error && <div className="text-red-600 dark:text-red-400 text-center mt-4 w-full p-3 bg-red-500/10 dark:bg-red-900/20 rounded-lg">{error}</div>}
                </Card>
            </div>
        </div>
    );
};