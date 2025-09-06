import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Conversation, Message, GroundingChunk } from '../types';
import { MessageAuthor } from '../types';
import { ChatMessage } from './ChatMessage';
import { createChatSession, sendMessageStream, generateConversationTitle, getErrorMessage } from '../services/geminiService';
import type { Chat, Part } from '@google/genai';
import { SendIcon } from './icons/SendIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { LogoIcon } from './icons/LogoIcon';


interface ChatViewProps {
  conversation: Conversation;
  onConversationUpdate: (conversation: Conversation) => void;
}

const suggestionButtons = [
    { title: "Écris un poème", subtitle: "sur le thème de la mer des Caraïbes" },
    { title: "Explique un concept complexe", subtitle: "comme un trou noir, simplement" },
    { title: "Donne-moi une idée de projet", subtitle: "en Python avec une API web" },
    { title: "Crée une recette de cuisine", subtitle: "originale avec du fruit à pain" },
];

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'fr-FR'; // Set language to French
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ChatView: React.FC<ChatViewProps> = ({ conversation, onConversationUpdate }) => {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [attachedFile, setAttachedFile] = useState<{ base64: string, mimeType: string, previewUrl: string } | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const stopGenerationRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(recognition);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      chatSessionRef.current = createChatSession();
    } catch (err) {
      console.error(err);
      const errorMessage = getErrorMessage(err);
      const errorBotMessage: Message = {
        id: `msg-${Date.now()}`,
        author: MessageAuthor.BOT,
        content: errorMessage,
      };
      setMessages([errorBotMessage]);
    }
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    rec.onstart = () => {
      setIsRecording(true);
    };
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    rec.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'not-allowed') {
        // 'not-allowed' is a permission error, we can inform the user if we want
        console.warn('Speech recognition permission might be denied or mic not available.');
      } else {
        console.error('Speech recognition error:', event.error);
      }
    };
    rec.onend = () => {
      setIsRecording(false);
    };

    return () => {
      if (rec) {
          rec.onstart = null;
          rec.onresult = null;
          rec.onerror = null;
          rec.onend = null;
      }
    };
  }, []);

  const handleStopGeneration = useCallback(() => {
      stopGenerationRef.current = true;
      setIsGenerating(false);
  }, []);

  const handleSendMessage = useCallback(async (prompt?: string) => {
    const userMessageContent = prompt || input;
    
    if (!userMessageContent.trim() && !attachedFile) return;
    if (isGenerating) return;

    if (!chatSessionRef.current) {
         const errorBotMessage: Message = {
            id: `msg-${Date.now()}`,
            author: MessageAuthor.BOT,
            content: getErrorMessage(new Error("Chat session not initialized.")),
        };
        setMessages(prev => [...prev, errorBotMessage]);
        return;
    };

    setIsGenerating(true);
    stopGenerationRef.current = false;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      author: MessageAuthor.USER,
      content: userMessageContent.trim(),
      image: attachedFile?.base64,
    };
    
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setInput('');
    if (attachedFile) {
        URL.revokeObjectURL(attachedFile.previewUrl);
        setAttachedFile(null);
    }


    const botMessagePlaceholder: Message = {
      id: `msg-${Date.now() + 1}`,
      author: MessageAuthor.BOT,
      content: '...',
    };

    setMessages(prev => [...prev, botMessagePlaceholder]);

    try {
      const imagePart: Part | undefined = attachedFile
        ? { inlineData: { data: attachedFile.base64, mimeType: attachedFile.mimeType } }
        : undefined;

      const stream = await sendMessageStream(chatSessionRef.current, userMessageContent.trim(), imagePart);
      
      let fullResponse = '';
      let currentSources: GroundingChunk[] = [];
      
      for await (const chunk of stream) {
        if (stopGenerationRef.current) {
            console.log("Stream stopped by user.");
            break;
        }

        fullResponse += chunk.text;
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            currentSources = [...(chunk.candidates[0].groundingMetadata.groundingChunks || [])];
        }

        const updatedSources = currentSources.length > 0 ? currentSources : undefined;

        setMessages(prev =>
            prev.map(m =>
                m.id === botMessagePlaceholder.id ? { ...m, content: fullResponse || '...', sources: updatedSources } : m
            )
        );
      }
      
      const finalBotResponse = fullResponse.trim() || (stopGenerationRef.current ? "Génération arrêtée." : "Désolé, je n'ai pas pu générer de réponse.");

      const finalMessagesForPersistence = [...messagesWithUser, {
          ...botMessagePlaceholder,
          content: finalBotResponse,
          sources: currentSources.length > 0 ? currentSources : undefined,
      }];

      setMessages(finalMessagesForPersistence);

      let updatedConversation = { ...conversation, messages: finalMessagesForPersistence };
      const firstUserMessage = finalMessagesForPersistence.find(m => m.author === MessageAuthor.USER)?.content || '';

      if (conversation.title === 'New Conversation' && finalMessagesForPersistence.length >= 2) {
          try {
              const title = await generateConversationTitle(firstUserMessage, finalBotResponse);
              if (title) {
                updatedConversation.title = title;
              }
          } catch (titleError) {
              console.error("Failed to generate conversation title:", titleError);
          }
      }
      
      onConversationUpdate(updatedConversation);


    } catch (err) {
      const errorMessage = getErrorMessage(err);
      const errorBotMessage: Message = {
        id: botMessagePlaceholder.id,
        author: MessageAuthor.BOT,
        content: errorMessage,
      };
      setMessages(prev => prev.map(m => m.id === botMessagePlaceholder.id ? errorBotMessage : m));
      onConversationUpdate({ ...conversation, messages: [...messagesWithUser, errorBotMessage] });
    } finally {
      setIsGenerating(false);
      stopGenerationRef.current = false;
    }
  }, [input, messages, onConversationUpdate, conversation, isGenerating, attachedFile]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
        alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
        return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      recognitionRef.current.start();
    }
  };

  const handlePromptSuggestionClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
            alert(`Format de fichier non supporté. Veuillez utiliser un fichier ${SUPPORTED_MIME_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')}.`);
            return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            alert(`Le fichier est trop volumineux. La taille maximale est de ${MAX_FILE_SIZE_MB} Mo.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setAttachedFile({
                base64: base64String,
                mimeType: file.type,
                previewUrl: URL.createObjectURL(file)
            });
        };
        reader.readAsDataURL(file);
    }
    // Reset file input value to allow selecting the same file again
    event.target.value = '';
  };
  
  const removeAttachment = () => {
      if (attachedFile) {
        URL.revokeObjectURL(attachedFile.previewUrl);
        setAttachedFile(null);
      }
  };


  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto mb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && !isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 min-h-[60vh]">
                  <div className="mb-6 inline-block p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg">
                      <LogoIcon className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Prophète sans censure</h1>
                  <p className="text-gray-500 dark:text-gray-400 mb-10">Comment puis-je vous aider à créer l'inimaginable aujourd'hui ?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                      {suggestionButtons.map((s, i) => (
                          <button
                              key={i}
                              onClick={() => handlePromptSuggestionClick(`${s.title} ${s.subtitle}`)}
                              className="bg-white dark:bg-gray-800/60 rounded-xl p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-all duration-200 transform hover:-translate-y-1 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700/60"
                          >
                              <p className="font-semibold text-black dark:text-white text-base leading-tight">{s.title}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-sm leading-tight mt-1">{s.subtitle}</p>
                          </button>
                      ))}
                  </div>
              </div>
          )}
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto">
        <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="relative"
            role="search"
        >
          {attachedFile && (
             <div className="relative w-fit mb-2 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
                 <img src={attachedFile.previewUrl} alt="Preview" className="h-20 w-auto rounded-md" />
                 <button
                    type="button"
                    onClick={removeAttachment}
                    className="absolute -top-2 -right-2 p-0.5 bg-gray-700 text-white rounded-full hover:bg-red-500 transition-colors"
                    aria-label="Remove attachment"
                 >
                    <XCircleIcon className="h-5 w-5"/>
                 </button>
             </div>
          )}
          <div className="flex items-end bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg w-full border border-gray-200 dark:border-gray-700">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={SUPPORTED_MIME_TYPES.join(',')}
            />
            <button
                type="button"
                aria-label="Joindre un fichier"
                className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
            >
                <PaperclipIcon className="h-6 w-6" />
            </button>
            <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
                }}
                placeholder="Discutez avec Prophète..."
                className="flex-grow bg-transparent placeholder-gray-500 dark:placeholder-gray-400 text-gray-800 dark:text-gray-200 text-base focus:outline-none resize-none py-2.5 px-2 max-h-48"
                rows={1}
                disabled={isGenerating}
            />
            <button
                type="button"
                aria-label="Microphone"
                className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                onClick={handleMicClick}
                disabled={!recognitionRef.current || isGenerating}
            >
                <MicrophoneIcon className={`h-6 w-6 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
            </button>
            <button
                type="submit"
                aria-label="Envoyer"
                disabled={isGenerating || (!input.trim() && !attachedFile)}
                className="ml-2 w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-full focus:outline-none disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-indigo-700 transition-all transform active:scale-90 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
                <SendIcon className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};