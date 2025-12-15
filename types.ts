
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  image?: string; // Base64 data URL
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastModified: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export type ViewMode = 'CHAT' | 'HQ' | 'TASKS' | 'HABITS' | 'APPS' | 'CALENDAR' | 'FILES' | 'SETTINGS' | 'MANAGER' | 'TEAMS' | 'DEMO';

export type TaskCategory = 'PRODUCT' | 'CONTENT' | 'MONEY' | 'ADMIN' | 'MEETING' | string;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: TaskCategory;
  date: Date; // Start time
  duration: number; // in minutes
  color?: string; // hex or class
  reminder?: number; // minutes before start (e.g., 15, 30, 60), undefined = no reminder
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  statusLabel?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  assignedTo?: string; // User ID of assignee
  projectId?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  revenue: number; // This can now be a cache, but real value derived from projects
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  avatar?: string;
}

export interface Project {
  id: string;
  title: string;
  client: string; // Name of client (legacy) or ID
  clientId?: string; // ID link
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  progress: number; // 0-100%
  deadline?: Date;
  tags: string[];
  color: string;
  notes?: string;
  price: number; // Project value
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[]; // ISO date strings
  frequency: 'DAILY' | 'WEEKLY';
  category: 'HEALTH' | 'WORK' | 'MINDSET';
}

export interface CanvasItem {
  id: string;
  type: 'IMAGE' | 'NOTE' | 'COMMENT';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string; // Image URL or Note Text
  color?: string; // For notes
  zIndex: number;
  author?: string; // For comments
}

export interface ContentAnalysisResult {
  score: number;
  verdict: string;
  captions: string[];
  hashtags: string;
}

export type FileType = 'IMAGE' | 'PDF' | 'DOC' | 'ZIP' | 'VIDEO';

export interface FileAsset {
  id: string;
  name: string;
  type: FileType;
  size: string;
  dateModified: Date;
  tag: string;
  folderId?: string; // Optional: if null, it's in root
  url?: string; // Data URL for preview
  isFavorite?: boolean;
  isTrashed?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string; // For nesting
  color?: string; // Hex color
  clientId?: string; // Link to client
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: boolean;
  displayName?: string;
  navOrder?: ViewMode[]; // New field for sidebar order
  geminiApiKey?: string;
  themeColor?: string; // HSL color value for primary theme color
  themeBackground?: string; // HSL color value for background
  themeForeground?: string; // HSL color value for foreground text
}

export interface TeamMember {
  id: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  avatar?: string;
  name?: string;
  status: 'ACTIVE' | 'INVITED' | 'PENDING' | 'INACTIVE';
  dailyStreak?: number; // Added for Team Page
}

export interface TeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
  readBy?: string[]; // User IDs who have read this message
  replyTo?: string; // ID of message being replied to
  reactions?: { emoji: string; userIds: string[] }[]; // Emoji reactions
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[]; // Detailed member info
  messages: TeamMessage[];
  tasks: Task[]; // Shared team tasks
  createdDate: Date;
  ownerId: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'SENT' | 'DELIVERED' | 'SEEN';
  image?: string;
  reactions: { emoji: string; userId: string }[];
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  messages: DirectMessage[];
  lastSeen?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Encrypted/Stored
  avatar?: string;
  isPro: boolean;
  preferences: UserPreferences;
  isGuest?: boolean;
  teamId?: string; // Link to shared Team
  teamMembers?: TeamMember[]; // Deprecated? Keep for transition or local caching
  teamChat?: TeamMessage[]; // Deprecated? Keep for transition or local caching
  aiMemory?: string; // AI Learning/Memory field
  friends?: Friend[];
  tokens: number; // Token balance for apps
  tokenWeekStart?: string; // ISO Date string for the start of the current token week
  notifications?: AppNotification[]; // In-app notifications
  lastSeen?: Date;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'SYSTEM';
  timestamp: Date;
  read: boolean;
  actionData?: {
    type: 'TEAM_INVITE' | 'CHAT_MESSAGE' | 'DEADLINE' | 'ROLE_ASSIGNMENT' | 'TASK_MODAL';
    teamId?: string;
    teamName?: string;
    taskId?: string;
    taskTitle?: string;
  };
}

export interface TokenTransaction {
  id: string;
  userId: string;
  requestId: string;
  feature: string;
  cost: number;
  timestamp: Date;
}
