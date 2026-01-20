
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

// Navigation structure for Designers Hub (includes legacy for backwards compatibility)
export type ViewMode =
  // New Designers Hub routes
  | 'BRAIN' | 'COMMAND_CENTER' | 'CLIENTS' | 'WORK' | 'CALENDAR' | 'MONEY'
  // Shared routes
  | 'FILES' | 'SETTINGS'
  // Legacy routes (kept for transition period)
  | 'CHAT' | 'HQ' | 'HABITS' | 'APPS' | 'MANAGER' | 'TEAMS' | 'DEMO';

// Autopilot modes for Brain system
export type AutopilotMode = 'ASSIST' | 'CONFIDENT' | 'STRICT';

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
  revenue: number; // Calculated from projects
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'RED_FLAG';
  notes?: string;
  avatar?: string;

  // Designers Hub: Client scoring system
  scores?: {
    paymentReliability: number;    // 0-100, based on payment history
    scopeCreepRisk: number;        // 0-100, based on revision requests
    stressCost: number;            // 0-100, based on communication patterns
    lifetimeValue: number;         // Total revenue from client
  };

  // Communication tracking
  communicationHistory?: {
    lastContact: Date;
    averageResponseTime: number;   // hours
    totalMessages: number;
    sentimentScore: number;        // AI-analyzed
  };

  // Intake metadata
  source?: 'INSTAGRAM' | 'WEBSITE' | 'EMAIL' | 'REFERRAL' | 'OTHER';
  intakeDate?: Date;
  intakeScore?: number;            // AI quality score from intake
}

export interface Project {
  id: string;
  title: string;
  client: string; // Name of client (legacy)
  clientId?: string; // ID link
  status: 'INTAKE' | 'ACTIVE' | 'PAUSED' | 'REVISION' | 'COMPLETED' | 'ARCHIVED';
  progress: number; // 0-100%
  deadline?: Date;
  tags: string[];
  color: string;
  notes?: string;
  price: number; // Project value

  // Designers Hub: Invoice tracking
  invoiceStatus?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  invoiceId?: string;

  // Scope management
  revisionsUsed?: number;
  revisionsAllowed?: number;        // Default 2
  scopeChangeRequests?: number;

  // Automation tracking
  lastClientActivity?: Date;
  autoActions?: AutoActionLog[];    // History of system actions
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[]; // ISO date strings
  frequency: 'DAILY' | 'WEEKLY';
  category: 'HEALTH' | 'WORK' | 'MINDSET';
}

// ============================================
// FINANCE MODULE TYPES
// ============================================

export interface FinancialGoal {
  id: string;
  target: number;
  label: string;
  deadline: string; // e.g., "Dec 2026" or ISO date
  createdAt: Date;
}

export type PurchasePriority = 'CRITICAL' | 'STRATEGIC' | 'LUXURY';
export type PurchaseStatus = 'WISHLIST' | 'SAVING' | 'AVAILABLE' | 'PURCHASED';

export interface PlannedPurchase {
  id: string;
  name: string;
  price: number;
  priority: PurchasePriority;
  status: PurchaseStatus;
  notes?: string;
  targetDate?: string;
  createdAt: Date;
}

export type SubscriptionFrequency = 'MONTHLY' | 'YEARLY' | 'WEEKLY';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  frequency: SubscriptionFrequency;
  nextBilling: Date;
  status: SubscriptionStatus;
  category?: string; // e.g., "Design Tools", "Hosting", "AI"
  notes?: string;
  createdAt: Date;
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
  style?: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right';
  };
  connectedTo?: string[]; // IDs of items this item is connected to
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
  theme: 'dark' | 'light' | 'black-and-white';
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
    type: 'TEAM_INVITE' | 'CHAT_MESSAGE' | 'DEADLINE' | 'ROLE_ASSIGNMENT' | 'TASK_MODAL' | 'REMINDER';
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

// ============================================
// DESIGNERS HUB: Automation System Types
// ============================================

export interface AutoActionLog {
  id: string;
  timestamp: Date;
  action: string;
  trigger: string;
  result: 'SUCCESS' | 'FAILED' | 'PENDING_APPROVAL';
  userOverride?: boolean;
}

export interface ApprovalRequest {
  id: string;
  timestamp: Date;
  type: 'DEADLINE_ADJUSTMENT' | 'PRICE_CHANGE' | 'CLIENT_PAUSE' | 'CLIENT_REJECT' | 'MEETING_DECLINE' | 'INVOICE_SEND' | 'SCOPE' | 'COMMUNICATION';
  title: string;
  message: string;
  data: Record<string, any>;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

export interface RiskAlert {
  id: string;
  timestamp: Date;
  type: 'LATE_PAYMENT' | 'SCOPE_CREEP' | 'BURNOUT' | 'UNDERCHARGING' | 'SLOW_PERIOD' | 'CLIENT_SILENT' | 'FINANCIAL' | 'DEADLINE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  message: string;
  acknowledged: boolean;
  data?: Record<string, any>;
}

export interface HandledAction {
  id: string;
  timestamp: Date;
  action: string;
  trigger: string;
  result: string;
  icon?: string;
}

export interface IntakeSubmission {
  id: string;
  timestamp: Date;
  data: {
    name: string;
    email: string;
    budget: string;
    timeline: string;
    description: string;
    source: string;
  };
  status: 'PENDING' | 'QUALIFIED' | 'REJECTED' | 'CONVERTED';
  aiScore?: number;
  aiAnalysis?: any;
}

// Designers Hub system state
export interface DesignersHubState {
  autopilotMode: AutopilotMode;
  pendingApprovals: ApprovalRequest[];
  riskAlerts: RiskAlert[];
  handledToday: HandledAction[];
  brainOpen: boolean;
  projects: Project[];
  clients: Client[];
  tasks: Task[];
}
