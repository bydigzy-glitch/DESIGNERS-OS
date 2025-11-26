
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export type ViewMode = 'CHAT' | 'HQ' | 'APPS' | 'CALENDAR' | 'FILES' | 'SETTINGS';

export type TaskCategory = 'PRODUCT' | 'CONTENT' | 'MONEY' | 'ADMIN' | 'MEETING';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: TaskCategory;
  date: Date; // Start time
  duration: number; // in minutes
  color?: string; // hex or class
  reminder?: number; // minutes before start (e.g., 15, 30, 60), undefined = no reminder
}

export interface InspirationLog {
  id: string;
  energyLevel: number; // 1-10;
  timestamp: Date;
}

export interface ContentAnalysisResult {
  score: number;
  verdict: string;
  captions: string[];
  hashtags: string;
}

export type FileType = 'IMAGE' | 'PDF' | 'DOC' | 'ZIP';

export interface FileAsset {
  id: string;
  name: string;
  type: FileType;
  size: string;
  dateModified: Date;
  tag: string;
  folderId?: string; // Optional: if null, it's in root
  url?: string; // Data URL for preview
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string; // For nesting
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isPro: boolean;
}
