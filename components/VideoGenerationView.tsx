import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateVideo, checkVideoStatus, getErrorMessage } from '../services/geminiService';
import type { GenerateVideosOperation } from '@google/genai';
import { SparklesIcon } from './icons/SparklesIcon';
import { VideoIcon } from './icons/VideoIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

const loadingMessages = [
    "Contacting the video AI...",
    "Your request is in the queue...",
    "The AI is imagining the scenes...",
    "Generating individual frames...",
    "Stitching the video together...",
    "Adding the final touches...",
    "Almost ready to premiere...",
];

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-lg shadow-gray-200/30 dark:shadow-black/30 ${className}`}>
        {children}
    </div>
);

export const VideoGenerationView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [operation, setOperation] = useState<GenerateVideosOperation | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const pollingIntervalRef = useRef<number | null>(null);
    const messageIntervalRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
            messageIntervalRef.current = null;
        }
    }, []);
    
    useEffect(() => {
        // Clean up object URL on component unmount
        return () => {
            stopPolling();
            if (videoUrl && videoUrl.startsWith('blob:')) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl, stopPolling]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Veuillez entrer une description pour la vidéo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        if (videoUrl && videoUrl.startsWith('blob:')) {
            URL.revokeObjectURL(videoUrl);
        }
        setVideoUrl(null);
        setOperation(null);
        stopPolling();
        setLoadingMessage(loadingMessages[0]);

        try {
            const initialOperation = await generateVideo(prompt);
            setOperation(initialOperation);
        } catch (err) {
            setError(getErrorMessage(err));
            setIsLoading(false);
        }
    }, [prompt, videoUrl, stopPolling]);

    useEffect(() => {
        const handleOperationResult = async (op: GenerateVideosOperation) => {
          stopPolling();
          if (op.error) {
            console.error("Video generation failed:", op.error);
            setError(`La génération de la vidéo a échoué: ${op.error.message}`);
            setIsLoading(false);
          } else if (op.response?.generatedVideos?.[0]?.video?.uri) {
            try {
              const downloadLink = op.response.generatedVideos[0].video.uri;
              const apiKey = process.env.API_KEY;
              if (!apiKey) {
                  throw new Error("API Key not found, cannot download video.");
              }
              const fetchUrl = `${downloadLink}&key=${apiKey}`;
              
              const response = await fetch(fetchUrl);
    
              if (!response.ok) {
                throw new Error(`Failed to fetch video file: ${response.statusText}`);
              }
              
              const blob = await response.blob();
              const objectUrl = URL.createObjectURL(blob);
              setVideoUrl(objectUrl);
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setIsLoading(false);
            }
          } else {
            setError("La génération de la vidéo a terminé mais n'a retourné aucune donnée. Essayez une description différente.");
            setIsLoading(false);
          }
        };
    
        if (operation?.done) {
          handleOperationResult(operation);
        } else if (operation && !operation.done && !pollingIntervalRef.current) {
          // Start polling for status
          pollingIntervalRef.current = window.setInterval(async () => {
            try {
              const updatedOp = await checkVideoStatus(operation);
              setOperation(updatedOp); // This will re-trigger the useEffect
            } catch (err) {
              setError(getErrorMessage(err));
              setIsLoading(false);
              stopPolling();
            }
          }, 10000); // Poll every 10 seconds
    
          // Cycle through loading messages
          let msgIndex = 0;
          messageIntervalRef.current = window.setInterval(() => {
            msgIndex = (msgIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[msgIndex]);
          }, 5000); // Change message every 5 seconds
        }
      }, [operation, stopPolling]);

    // Effect to play video when URL is set
    useEffect(() => {
        if (videoUrl && videoRef.current) {
            videoRef.current.play();
        }
    }, [videoUrl]);

    return (
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 overflow-y-auto bg-transparent">
            <div className="w-full max-w-4xl flex flex-col gap-6">
                <div className="p-4 bg-indigo-500/10 dark:bg-indigo-500/20 border-l-4 border-indigo-500 rounded-r-lg flex items-start gap-3">
                    <InformationCircleIcon className="h-6 w-6 text-indigo-500 mt-0.5 shrink-0"/>
                    <div>
                        <h4 className="font-bold text-indigo-800 dark:text-indigo-300">Veuillez noter</h4>
                        <p className="text-sm text-indigo-700 dark:text-indigo-400">
                            La génération de vidéos est une fonctionnalité de pointe en phase de test. Il existe une limite quotidienne de générations gratuites. Merci de votre compréhension ! ✨
                        </p>
                    </div>
                </div>

                <Card>
                    <h2 className="text-2xl font-bold mb-4">Générateur de Vidéo IA</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Décrivez la vidéo que vous souhaitez créer. Soyez aussi imaginatif que vous le souhaitez.</p>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ex: Un plan drone cinématographique au-dessus des plages de sable blanc de la Barbade au coucher du soleil..."
                        className="w-full h-32 p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-4"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg transform hover:-translate-y-px"
                    >
                        <SparklesIcon className="h-6 w-6" />
                        {isLoading ? 'Génération en cours...' : 'Générer la Vidéo'}
                    </button>
                </Card>

                <Card className="flex flex-col items-center justify-center p-4 h-full min-h-[50vh]">
                    <div className="w-full h-full flex-1 bg-gray-100 dark:bg-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
                        {isLoading && (
                            <div className="text-center text-gray-500 dark:text-gray-400 p-4 w-full max-w-sm">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400 mx-auto mb-4"></div>
                                <p className="font-semibold text-lg mb-2">La génération peut prendre quelques minutes.</p>
                                <p key={loadingMessage} className="text-gray-400 dark:text-gray-500 animate-fade-in min-h-[20px]">{loadingMessage}</p>
                                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5 mt-4 overflow-hidden">
                                    <div className="bg-indigo-400 h-1.5 rounded-full animate-indeterminate-progress"></div>
                                </div>
                            </div>
                        )}
                        {!isLoading && videoUrl && (
                            <>
                                <video ref={videoRef} src={videoUrl} controls autoPlay loop className="w-full h-full object-contain bg-black">
                                    Your browser does not support the video tag.
                                </video>
                                <a
                                    href={videoUrl}
                                    download={`prophete-developpeur-video-${Date.now()}.mp4`}
                                    className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <DownloadIcon className="h-5 w-5"/>
                                    Télécharger
                                </a>
                            </>
                        )}
                        {!isLoading && !videoUrl && (
                            <div className="text-center text-gray-400 dark:text-gray-500 p-4">
                                <VideoIcon className="h-20 w-20 mx-auto mb-4 opacity-50"/>
                                <p className="font-semibold text-lg">Votre vidéo apparaîtra ici</p>
                            </div>
                        )}
                    </div>
                    {error && <div className="text-red-600 dark:text-red-400 text-center mt-4 w-full p-3 bg-red-500/10 dark:bg-red-900/20 rounded-lg">{error}</div>}
                </Card>
            </div>
        </div>
    );
};