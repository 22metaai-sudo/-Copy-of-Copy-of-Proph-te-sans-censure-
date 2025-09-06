
export enum MessageAuthor {
  USER = 'user',
  BOT = 'bot',
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface Message {
  id: string;
  author: MessageAuthor;
  content: string;
  sources?: GroundingChunk[];
  image?: string; // base64 encoded image data
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export interface ProjectFile {
  fileName: string;
  code: string;
}