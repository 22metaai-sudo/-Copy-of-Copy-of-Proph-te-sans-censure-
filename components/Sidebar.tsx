import React, { useState } from 'react';
import type { Conversation } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ChatBubbleLeftIcon } from './icons/ChatBubbleLeftIcon';
import { SearchIcon } from './icons/SearchIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAll,
  isOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <aside
        id="sidebar"
        className={`flex flex-col h-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700/60 shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-72 p-4' : 'w-0 p-0 border-r-0'}`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Historique</h2>
          <button
            onClick={onNewConversation}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-px active:scale-95"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau
          </button>
        </div>
        <div className="relative mb-4">
            <label htmlFor="sidebar-search" className="sr-only">
                Rechercher dans l'historique
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
                id="sidebar-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 bg-gray-200 dark:bg-gray-700/60 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
        </div>
        <div className="flex-1 overflow-y-auto -mr-4 pr-4">
          <ul className="space-y-2">
            {filteredConversations.map((conv, index) => (
              <li 
                key={conv.id}
                className="relative group animate-stagger-in" 
                style={{ '--delay': `${index * 50}ms` } as React.CSSProperties}
              >
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full text-left pl-4 pr-10 py-2.5 rounded-lg transition-colors flex items-center ${
                    conv.id === activeConversationId
                      ? 'bg-indigo-500/20 text-indigo-800 dark:bg-indigo-500/30 dark:text-white font-semibold'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700/60'
                  }`}
                >
                  {conv.id === activeConversationId && <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-r-full"></div>}
                  <ChatBubbleLeftIcon className="h-5 w-5 mr-3 shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
                  <span className="truncate">{conv.title}</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    aria-label="Supprimer la conversation"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-300 dark:border-gray-700 space-y-2">
           <button 
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 rounded-lg hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 transition-colors"
              aria-label="Supprime toutes les conversations"
            >
                <TrashIcon className="h-4 w-4" />
                <span>Effacer tout l'historique</span>
            </button>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Powered by Gemini
            </div>
        </div>
      </aside>
  );
};