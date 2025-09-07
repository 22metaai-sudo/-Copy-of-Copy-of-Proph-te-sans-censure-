import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { MessageAuthor } from '../types';
import { UserIcon } from './icons/UserIcon';
import { LogoIcon } from './icons/LogoIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { PencilIcon } from './icons/PencilIcon';

const CodeBlock = ({ code }: { code: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        if (isCopied) return;
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => console.error("Failed to copy code: ", err));
    };
    return (
        <div className="relative group my-2 text-left">
            <pre className="bg-gray-800 dark:bg-black/50 p-4 rounded-md overflow-x-auto">
                <code className="text-sm font-mono text-white whitespace-pre-wrap">{code}</code>
            </pre>
            <button
                onClick={handleCopy}
                aria-label={isCopied ? "Copié !" : "Copier le code"}
                className="absolute top-2 right-2 p-1.5 bg-gray-700/50 rounded-md text-gray-300 hover:bg-gray-600/50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
                {isCopied ? <CheckIcon className="h-4 w-4 text-green-400" /> : <ClipboardIcon className="h-4 w-4" />}
            </button>
        </div>
    );
};

const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\\\(.*?\\\)|`.*?`|\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);
    return parts.map((part, index) => {
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
            return part;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded px-1.5 py-1 font-mono">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

const formattedContent = (content: string): React.ReactNode => {
    if (!content) return null;
    const blocks = content.split(/(\`\`\`[\s\S]*?\`\`\`|\\\[[\s\S]*?\\\])/g);

    return blocks.map((block, index) => {
        if (block.startsWith('```')) {
            const code = block.replace(/^```(?:\w+\n)?|```$/g, '');
            return <CodeBlock key={index} code={code} />;
        }

        if (block.startsWith('\\[')) {
            return <div key={index}>{block}</div>;
        }

        const lines = block.split('\n');
        const elements: React.ReactElement[] = [];
        let listItems: React.ReactElement[] = [];
        let listType: 'ul' | 'ol' | null = null;
        
        const endList = () => {
            if (listItems.length > 0 && listType) {
                const className = listType === 'ul' ? "list-disc pl-5 my-2" : "list-decimal pl-5 my-2";
                elements.push(React.createElement(listType, { key: `list-${elements.length}`, className }, listItems));
                listItems = [];
                listType = null;
            }
        };

        lines.forEach((line, lineIndex) => {
            if (line.startsWith('# ')) { endList(); elements.push(<h1 key={lineIndex} className="text-2xl font-bold mt-4 mb-2">{renderInlineMarkdown(line.substring(2))}</h1>); return; }
            if (line.startsWith('## ')) { endList(); elements.push(<h2 key={lineIndex} className="text-xl font-bold mt-4 mb-2">{renderInlineMarkdown(line.substring(3))}</h2>); return; }
            if (line.startsWith('### ')) { endList(); elements.push(<h3 key={lineIndex} className="text-lg font-bold mt-3 mb-1">{renderInlineMarkdown(line.substring(4))}</h3>); return; }

            const ulMatch = line.match(/^(\s*)[-*] (.*)/);
            if (ulMatch) {
                if (listType !== 'ul') endList();
                listType = 'ul';
                listItems.push(<li key={lineIndex}>{renderInlineMarkdown(ulMatch[2])}</li>);
                return;
            }
            
            const olMatch = line.match(/^(\s*)\d+\. (.*)/);
            if (olMatch) {
                if (listType !== 'ol') endList();
                listType = 'ol';
                listItems.push(<li key={lineIndex}>{renderInlineMarkdown(olMatch[2])}</li>);
                return;
            }

            endList();
            if (line.trim().length > 0) {
                elements.push(<p key={lineIndex} className="my-1">{renderInlineMarkdown(line)}</p>);
            }
        });

        endList();

        return <div key={index}>{elements}</div>;
    });
};

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.author === MessageAuthor.USER;
  const [isTextCopied, setIsTextCopied] = useState(false);
  const [isImageCopied, setIsImageCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const messageBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (messageBodyRef.current && (window as any).MathJax) {
      (window as any).MathJax.typesetPromise([messageBodyRef.current]).catch((err: any) =>
        console.error('MathJax typesetting error:', err)
      );
    }
  }, [message.content]);

  const handleCopyText = () => {
    if (isTextCopied || !message.content) return;
    navigator.clipboard.writeText(message.content).then(() => {
        setIsTextCopied(true);
        setTimeout(() => setIsTextCopied(false), 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
  };

  const handleCopyImage = async () => {
    if (!message.image || isImageCopied) return;
    try {
      const blob = await (await fetch(`data:image/png;base64,${message.image}`)).blob();
      await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
      ]);
      setIsImageCopied(true);
      setTimeout(() => setIsImageCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy image: ", err);
    }
  };

  const handleSpeak = () => {
    const speech = window.speechSynthesis;

    if (isSpeaking && utteranceRef.current) {
      speech.cancel();
      return;
    }
    
    if (speech.speaking) {
        speech.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(message.content);
    utteranceRef.current = utterance;
    utterance.lang = 'fr-FR';
    
    const maleFrenchVoice = voices.find(
      (voice) =>
        voice.lang === 'fr-FR' &&
        (voice.name.toLowerCase().includes('male') ||
         voice.name.toLowerCase().includes('homme') ||
         voice.name.includes('Thomas') ||
         voice.name.includes('Paul'))
    );

    if (maleFrenchVoice) {
      utterance.voice = maleFrenchVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { if (utteranceRef.current === utterance) { setIsSpeaking(false); utteranceRef.current = null; } };
    utterance.onerror = (event) => { console.error("Speech synthesis error:", event); if (utteranceRef.current === utterance) { setIsSpeaking(false); utteranceRef.current = null; } };
    speech.speak(utterance);
  };

  const handleEditImage = () => {
    if (message.image) {
        const event = new CustomEvent('editImage', { detail: message.image });
        window.dispatchEvent(event);
    }
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''} animate-fade-in`}>
      {!isUser && (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
          <LogoIcon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
      )}
      <div className={`max-w-2xl w-fit ${isUser ? 'order-1' : 'order-2'}`}>
        <div className="relative group">
            <div
            ref={messageBodyRef}
            className={`rounded-2xl shadow-md ${
                isUser
                ? 'bg-indigo-600 text-white rounded-br-lg'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'
            } ${(message.image && !message.content) ? 'p-1.5' : 'px-5 py-3'}`}
            >
            {message.image && (
                <div className="mb-2 relative group max-w-sm">
                    <img
                        src={`data:image/png;base64,${message.image}`}
                        alt={isUser ? "Image envoyée" : "Généré par l'IA"}
                        className="rounded-lg max-w-full h-auto"
                    />
                     {!isUser && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 p-1 rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                            <button onClick={handleCopyImage} className="p-1.5 text-white hover:bg-white/20 rounded-md" aria-label={isImageCopied ? "Copié !" : "Copier l'image"}>
                                 {isImageCopied ? <CheckIcon className="h-4 w-4 text-green-400" /> : <ClipboardIcon className="h-4 w-4" />}
                            </button>
                            <a href={`data:image/png;base64,${message.image}`} download={`prophete-developpeur-img-${message.id}.png`} className="p-1.5 text-white hover:bg-white/20 rounded-md" aria-label="Télécharger l'image">
                                <DownloadIcon className="h-4 w-4" />
                            </a>
                        </div>
                     )}
                </div>
            )}
            <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                {message.content === '...' ? (
                    <div className="flex items-center gap-2">
                        <span className="sr-only">Prophète sans censure réfléchit...</span>
                        <div className="h-2.5 w-2.5 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="h-2.5 w-2.5 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="h-2.5 w-2.5 bg-gray-400 rounded-full animate-pulse"></div>
                    </div>
                ) : formattedContent(message.content)}
            </div>
            </div>
            {!isUser && message.content && message.content !== '...' && (
                <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-full ml-2 flex items-center gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                    <button
                        onClick={handleCopyText}
                        aria-label="Copier le texte"
                        className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        {isTextCopied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={handleSpeak}
                        aria-label={isSpeaking ? "Arrêter la lecture" : "Lire le texte"}
                        className={`p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${isSpeaking ? 'text-indigo-500 dark:text-indigo-400' : ''}`}
                    >
                        <SpeakerWaveIcon className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
        
        {message.image && (
             <div className="mt-2">
                <button 
                    onClick={handleEditImage}
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg"
                >
                    <PencilIcon className="h-4 w-4" />
                    Éditer cette image
                </button>
            </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Sources consultées 📚</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.sources.filter(source => source.web?.uri).map((source, index) => (
                <a
                  key={index}
                  href={source.web!.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-all duration-200 border border-gray-200 dark:border-gray-700/50 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md"
                >
                  <p className="font-medium text-xs text-indigo-700 dark:text-indigo-400 truncate">{source.web!.title || 'Source'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{source.web!.uri}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center order-2 shadow-md">
          <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
