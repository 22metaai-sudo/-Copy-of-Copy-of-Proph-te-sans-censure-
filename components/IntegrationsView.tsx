import React, { useState, useMemo } from 'react';
import { GoogleIcon } from './icons/GoogleIcon';
import { NotionIcon } from './icons/NotionIcon';
import { MicrosoftIcon } from './icons/MicrosoftIcon';
import { SlackIcon } from './icons/SlackIcon';
import { TwitterIcon } from './icons/TwitterIcon';
import { RedditIcon } from './icons/RedditIcon';
import { HackerNewsIcon } from './icons/HackerNewsIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { SheetsIcon } from './icons/SheetsIcon';
import { WifiIcon } from './icons/WifiIcon';
import { PuzzlePieceIcon } from './icons/PuzzlePieceIcon';


type ToolStatus = 'installed' | 'not_installed' | 'requires_browser';
interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    status: ToolStatus;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const initialTools: Tool[] = [
    // Google
    { id: 'gsuite', name: 'Google Suite', description: 'Accédez à votre suite Google Workspace, comprenant Gmail, Calendrier, Drive, et plus encore.', category: 'Google Suite', status: 'installed', icon: GoogleIcon },
    { id: 'gmail', name: 'Gmail', description: 'Accédez à votre boîte de réception Gmail, lisez et envoyez des e-mails, et recherchez dans vos messages.', category: 'Google Suite', status: 'installed', icon: GoogleIcon },
    { id: 'gcal', name: 'Calendar', description: 'Gérez vos événements Google Agenda, planifiez des rendez-vous, et consultez votre emploi du temps.', category: 'Google Suite', status: 'installed', icon: GoogleIcon },
    { id: 'gdrive', name: 'Drive', description: 'Accédez aux fichiers stockés dans votre Google Drive, téléchargez des documents, et partagez du contenu.', category: 'Google Suite', status: 'installed', icon: GoogleIcon },
    // Notion
    { id: 'notion', name: 'Notion', description: 'Accédez à vos pages Notion, créez et modifiez du contenu, et gérez votre espace de travail.', category: 'Productivity', status: 'not_installed', icon: NotionIcon },
    // Microsoft
    { id: 'm365', name: 'Microsoft 365', description: 'Accédez à votre boîte de réception Microsoft 365, e-mails via Outlook, événements, Teams, OneDrive et SharePoint.', category: 'Microsoft 365', status: 'not_installed', icon: MicrosoftIcon },
    { id: 'outlook_email', name: 'Outlook Email', description: 'Accédez à votre boîte de réception Outlook, lisez et envoyez des e-mails, et recherchez dans vos messages.', category: 'Microsoft 365', status: 'not_installed', icon: MicrosoftIcon },
    { id: 'outlook_cal', name: 'Outlook Calendar', description: 'Accédez à votre calendrier Outlook avec des autorisations améliorées ! Créez, gérez et recherchez des événements.', category: 'Microsoft 365', status: 'not_installed', icon: MicrosoftIcon },
    { id: 'mteams', name: 'Microsoft Teams', description: 'Accès complet à Microsoft Teams avec des permissions d\'administration ! Recherchez, envoyez des messages, et gérez des équipes.', category: 'Microsoft 365', status: 'not_installed', icon: MicrosoftIcon },
    { id: 'monedrive', name: 'Microsoft OneDrive', description: 'Accès complet d\'entreprise à OneDrive, SharePoint et Microsoft 365 ! Recherchez, gérez le contenu, et plus encore.', category: 'Microsoft 365', status: 'not_installed', icon: MicrosoftIcon },
    { id: 'msharepoint', name: 'Microsoft SharePoint', description: 'Accès complet pour l\'entreprise aux sites, pages, listes et contenus SharePoint. Effectuez des recherches sur tous les sites.', category: 'Microsoft 365', status: 'not_installed', icon: MicrosoftIcon },
    // Slack
    { id: 'slack', name: 'Slack', description: 'Accédez à votre Slack, lisez et envoyez des messages et recherchez dans vos messages.', category: 'Productivity', status: 'not_installed', icon: SlackIcon },
    // Outils MCP
    { id: 'twitter_mcp', name: 'X/Twitter Content Explorer', description: 'Recherchez et explorez le contenu de X/Twitter directement via l\'automatisation du navigateur. ', category: 'Outils MCP', status: 'requires_browser', icon: TwitterIcon },
    { id: 'playwright_mcp', name: 'Playwright Browser Automation', description: 'Exécutez des opérations de navigation automatisées grâce à des instructions en langage naturel.', category: 'Outils MCP', status: 'requires_browser', icon: TerminalIcon },
    { id: 'webfetch_mcp', name: 'Local Web Fetch', description: 'Accédez au contenu web en utilisant votre session de navigateur local. Cet outil peut récupérer le contenu de sites où vous êtes déjà connecté.', category: 'Outils MCP', status: 'requires_browser', icon: WifiIcon },
    { id: 'reddit_mcp', name: 'Reddit MCP', description: 'Reddit MCP interagit avec l\'API publique de Reddit et expose la fonctionnalité via le protocole MCP.', category: 'Outils MCP', status: 'not_installed', icon: RedditIcon },
    { id: 'wiki_mcp', name: 'Deep Wiki MCP', description: 'Génère automatiquement des diagrammes d\'architecture, de la documentation, et des liens vers le code source.', category: 'Outils MCP', status: 'not_installed', icon: BookOpenIcon },
    { id: 'chart_mcp', name: 'Chart Server MCP', description: 'Un serveur MCP basé sur TypeScript offrant des capacités de génération de graphiques.', category: 'Outils MCP', status: 'not_installed', icon: SheetsIcon },
    { id: 'hackernews_mcp', name: 'Hacker News MCP', description: 'Serveur MCP officiel de Hacker News - Ajoute une intégration puissante avec Hacker News, accédez aux histoires, commentaires, etc.', category: 'Outils MCP', status: 'not_installed', icon: HackerNewsIcon },
];

const categories = ['Google Suite', 'Microsoft 365', 'Productivity', 'Outils MCP'];

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-lg shadow-gray-200/30 dark:shadow-black/30 ${className}`}>
        {children}
    </div>
);

const ToolCard: React.FC<{tool: Tool, onToggle: (id: string) => void}> = ({ tool, onToggle }) => {
    const Icon = tool.icon;
    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex-1">{tool.name}</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow mb-4">{tool.description}</p>
            <div className="mt-auto">
                {tool.status === 'requires_browser' ? (
                     <div className="text-xs text-center font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 py-2 rounded-md">
                        Navigateur Genspark requis
                    </div>
                ) : (
                    <button 
                        onClick={() => onToggle(tool.id)}
                        className={`w-full py-2 rounded-md font-semibold text-sm transition-colors ${
                            tool.status === 'installed'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}
                    >
                        {tool.status === 'installed' ? 'Désinstaller' : 'Installer'}
                    </button>
                )}
            </div>
        </div>
    )
}


export const IntegrationsView: React.FC = () => {
    const [tools, setTools] = useState<Tool[]>(initialTools);

    const handleToggleStatus = (id: string) => {
        setTools(prevTools => prevTools.map(tool =>
            tool.id === id
                ? { ...tool, status: tool.status === 'installed' ? 'not_installed' : 'installed' }
                : tool
        ));
    };

    const groupedTools = useMemo(() => {
        return categories.map(category => ({
            name: category,
            tools: tools.filter(tool => tool.category === category)
        }));
    }, [tools]);

    return (
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-transparent">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><PuzzlePieceIcon className="h-8 w-8 text-indigo-500"/> Intégrations & Outils</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">Connectez vos services préférés et améliorez vos capacités avec des outils puissants.</p>
                </div>

                {groupedTools.map(group => (
                    <div key={group.name} className="mb-10">
                        <h2 className="text-2xl font-semibold border-b border-gray-300 dark:border-gray-600 pb-2 mb-6 text-gray-800 dark:text-gray-100">{group.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {group.tools.map(tool => (
                                <ToolCard key={tool.id} tool={tool} onToggle={handleToggleStatus} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};