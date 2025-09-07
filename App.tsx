import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Conversation } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { Header } from './components/Header';
import { ImageGenerationView } from './components/ImageGenerationView';
import { ImageEditingView } from './components/ImageEditingView';
import { VideoGenerationView } from './components/VideoGenerationView';
import { SlidesGenerationView } from './components/SlidesGenerationView';
import { SheetsGenerationView } from './components/SheetsGenerationView';
import { DevelopmentView } from './components/DevelopmentView';
import { IntegrationsView } from './components/IntegrationsView';
import { Toast } from './components/Toast';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';

export type View = 'chat' | 'generate' | 'edit' | 'video' | 'slides' | 'sheets' | 'development' | 'integrations';
export type Theme = 'light' | 'dark';

const StatusBar = () => {
  return (
    <div
      className="ios-status-bar flex justify-between items-center px-4 pt-2 pb-1 select-none text-black dark:text-white"
      style={{ fontFeatureSettings: "'tnum'" }}
    >
      <div className="flex items-center space-x-2">
        <span className="font-normal">12:25 PM</span>
        <span className="font-normal">Mercredi 3 septembre</span>
      </div>
      <div className="flex items-center space-x-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="4"
          height="4"
          fill="currentColor"
          viewBox="0 0 8 8"
        >
          <circle cx="1" cy="4" r="1" />
          <circle cx="4" cy="4" r="1" />
          <circle cx="7" cy="4" r="1" />
        </svg>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [activeView, setActiveView] = useState<View | 'welcome'>('welcome');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
    }
    return 'dark'; // Default to dark
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    
    body.classList.remove('aurora-background', 'bg-white', 'dark:bg-stone-950');

    if (theme === 'dark') {
        html.classList.add('dark');
        body.classList.add('dark', 'aurora-background');
        body.style.backgroundColor = '#0c0a09';
    } else {
        html.classList.remove('dark');
        body.classList.remove('dark');
        body.style.backgroundColor = '#f4f4f5'; // A light gray for better contrast
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleNavigate = (view: View) => {
    if (view === 'chat' && !activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
    setActiveView(view);
  };

  const handleGoHome = useCallback(() => {
    setActiveView('welcome');
  }, []);

  const handleNewConversation = useCallback((activate = true) => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    if (activate) {
       setActiveConversationId(newConversation.id);
    }
    setActiveView('chat');
  }, []);

  const handleEditImageFromChat = useCallback((imageBase64: string) => {
    setImageToEdit(imageBase64);
    setActiveView('edit');
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
        const customEvent = event as CustomEvent<string>;
        if (customEvent.detail) {
            handleEditImageFromChat(customEvent.detail);
        }
    };
    window.addEventListener('editImage', handler);
    return () => {
        window.removeEventListener('editImage', handler);
    };
  }, [handleEditImageFromChat]);

  // Load conversations from localStorage on initial render.
  useEffect(() => {
    try {
        const savedConversations = localStorage.getItem('conversations');
        if (savedConversations) {
            const parsedConversations: Conversation[] = JSON.parse(savedConversations);
            if (Array.isArray(parsedConversations) && parsedConversations.length > 0) {
                setConversations(parsedConversations);
                const savedActiveId = localStorage.getItem('activeConversationId');
                // Check if the saved active ID is valid and exists in the loaded conversations
                if (savedActiveId && parsedConversations.some(c => c.id === savedActiveId)) {
                    setActiveConversationId(savedActiveId);
                } else {
                    setActiveConversationId(parsedConversations[0].id); // Fallback to the first one
                }
            } else {
                handleNewConversation(false); // don't activate chat view immediately
            }
        } else {
            handleNewConversation(false); // No saved data, start fresh but don't activate
        }
    } catch (error) {
        console.error("Failed to load conversations from localStorage:", error);
        handleNewConversation(false); // Start fresh if there's an error
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on initial mount

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
        localStorage.setItem('conversations', JSON.stringify(conversations));
    } else {
        // If all conversations are deleted, clear from storage
        localStorage.removeItem('conversations');
        localStorage.removeItem('activeConversationId');
    }
  }, [conversations]);

  // Save the active conversation ID to localStorage
  useEffect(() => {
      if (activeConversationId) {
          localStorage.setItem('activeConversationId', activeConversationId);
      }
  }, [activeConversationId]);


  const handleUpdateConversation = useCallback((updatedConversation: Conversation) => {
    setConversations(prev =>
      prev.map(c => (c.id === updatedConversation.id ? updatedConversation : c))
    );
  }, []);

  const handleDeleteConversation = (idToDelete: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.')) {
      const conversationTitle = conversations.find(c => c.id === idToDelete)?.title || '';
      setConversations(prev => {
        const newConversations = prev.filter(c => c.id !== idToDelete);
        
        if (activeConversationId === idToDelete) {
          if (newConversations.length > 0) {
            setActiveConversationId(newConversations[0].id);
          } else {
            setActiveConversationId(null);
            handleNewConversation(true);
          }
        }
        return newConversations;
      });
      showToast(`Conversation "${conversationTitle}" supprimée.`, 'info');
    }
  };

  const handleClearAllConversations = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer TOUTES les conversations ? Cette action est irréversible.')) {
        setConversations([]);
        setActiveConversationId(null);
        handleNewConversation(true);
        showToast('Toutes les conversations ont été supprimées.', 'info');
    }
  };


  const activeConversation = conversations.find(c => c.id === activeConversationId);
  
  const viewTitleMap: Record<View, string> = {
    chat: activeConversation?.title === 'New Conversation' ? 'Nouveau Chat' : activeConversation?.title || 'Chat',
    development: "Constructeur de Projets",
    integrations: "Intégrations & Outils",
    generate: "Créateur de Visions",
    edit: "Alchimie Visuelle",
    video: "Chronomancien Vidéo",
    slides: "Synthétiseur de Savoir",
    sheets: "Oracle de Données",
  };

  const renderActiveView = () => {
    switch(activeView) {
        case 'chat':
            return activeConversation ? (
                <ChatView
                    key={activeConversation.id}
                    conversation={activeConversation}
                    onConversationUpdate={handleUpdateConversation}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center text-center p-4">
                    <p className="text-gray-500 dark:text-gray-400">
                      Veuillez sélectionner une conversation ou en créer une nouvelle pour commencer.
                    </p>
                </div>
            );
        case 'development': return <DevelopmentView />;
        case 'generate': return <ImageGenerationView />;
        case 'edit': return <ImageEditingView initialImageBase64={imageToEdit} onDone={() => setImageToEdit(null)}/>;
        case 'video': return <VideoGenerationView />;
        case 'slides': return <SlidesGenerationView />;
        case 'sheets': return <SheetsGenerationView />;
        case 'integrations': return <IntegrationsView />;
        default: return null;
    }
  };

  if (activeView === 'welcome') {
    return <WelcomeScreen onNavigate={handleNavigate} />;
  }

  return (
    <div className="flex flex-col h-screen w-full text-gray-900 dark:text-white font-sans bg-transparent">
      <StatusBar />
      <div className="flex-1 flex overflow-hidden">

        {activeView === 'chat' && (
            <Sidebar
                isOpen={isSidebarOpen}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={setActiveConversationId}
                onNewConversation={() => handleNewConversation(true)}
                onDeleteConversation={handleDeleteConversation}
                onClearAll={handleClearAllConversations}
            />
        )}
        <main className="flex-1 flex flex-col transition-all duration-300 overflow-hidden">
          <Header 
              title={viewTitleMap[activeView]}
              theme={theme}
              toggleTheme={toggleTheme}
              isSidebarVisible={activeView === 'chat'}
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              activeView={activeView}
              onNavigate={handleNavigate}
              onGoHome={handleGoHome}
          />
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900/50">
              {renderActiveView()}
          </div>
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
