/**
 * Shared Type Definitions for Shorts Intel Hub
 * Export this file to your backend team for consistency
 */

// ============================================================================
// TREND TYPES
// ============================================================================

export interface Trend {
  id: string;
  topicName: string;
  description: string;
  targetDemo: string;
  referenceLink: string;
  hashtags?: string[];
  audio?: string;
  rank: number;
  score: number;
  velocity: 'increasing' | 'stable' | 'decreasing';
  ageInWeeks: number;
  source: TrendSource;

  // Performance metrics
  viewsVolume?: string;
  viewsVelocity?: string;
  creationRate?: string;
  watchtimeVolume?: string;
  watchtimeVelocity?: string;

  // Quality & safety (Vayner/Nyan Cat analysis)
  contentQuality?: ContentQuality;
  brandSafe?: boolean;
  sentiment?: Sentiment;
  hidden?: boolean;
  hiddenReason?: string;
  ers?: number | null;

  // Trend analytics (Vayner fields)
  trendVelocity?: TrendVelocityStage;
  trendBucket?: string;
  creationComplexity?: CreationComplexity;
  trendScale?: TrendScale;
  platformsTrending?: string[];
  primaryMarkets?: string[];
  secondaryMarkets?: string[];
  platformOrigin?: string;
  aiTool?: string;
  genAI?: boolean;
  initialTrigger?: string;
  engagementRate?: number;

  // Raw metrics (pre-aggregation)
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  creatorSubs?: number;
  publicationDate?: string;
  dateIdentified?: string;

  // Backend metadata
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  archivedAt?: string;
  geminiProcessedAt?: string;
}

export type TrendSource = 'Search' | 'Nyan Cat' | 'Vayner' | 'Agency' | 'Music';
export type TrendVelocity = 'increasing' | 'stable' | 'decreasing';
export type TrendVelocityStage = 'Trending' | 'Emerging' | 'Niche';
export type ContentQuality = 'good' | 'potentiallyAISlop' | 'aiSlop';
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';
export type CreationComplexity = 'Easy' | 'Medium' | 'Hard';
export type TrendScale = 'Creation-Led' | 'Viewer-led';

// ============================================================================
// MARKET TYPES
// ============================================================================

export interface Market {
  code: string;
  name: string;
}

export const APAC_MARKETS: Market[] = [
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'AUNZ', name: 'Australia & New Zealand' },
];

// ============================================================================
// DEMOGRAPHIC TYPES
// ============================================================================

export type Gender = 'Males' | 'Females' | 'All';
export type AgeRange = '13-17' | '18-24' | '25-34' | '35-44' | '45+';

export type TargetDemo = 
  | 'All Demographics'
  | 'Males 13-17'
  | 'Males 18-24'
  | 'Males 25-34'
  | 'Males 35-44'
  | 'Males 45+'
  | 'Females 13-17'
  | 'Females 18-24'
  | 'Females 25-34'
  | 'Females 35-44'
  | 'Females 45+';

// ============================================================================
// SCORING TYPES — External Ranking Score (ERS)
// ============================================================================

export interface ScoringConfig {
  velocity: {
    trending: number;
    emerging: number;
    niche: number;
  };
  breakout: {
    heavyMultiplier: number;   // views > subs * 5
    lightMultiplier: number;   // views > subs
    baseMultiplier: number;    // otherwise
    heavyThreshold: number;    // multiple of subs for heavy
  };
  scale: {
    creatorLed: number;
    viewerLed: number;
  };
  complexity: {
    easy: number;
    medium: number;
    hard: number;
  };
  distribution: {
    perPlatformBoost: number;  // added per platform listed
    perMarketBoost: number;    // added per market listed
  };
  freshness: {
    recentDays: number;         // <= N days → boost
    staleDays: number;          // > N days → penalty
    stalePenalty: number;
  };
  quality: {
    potentialSlopMultiplier: number;
    slopHidden: boolean;
  };
  origin: {
    youtubeShortsBoost: number;
  };
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  velocity: { trending: 2.5, emerging: 1.5, niche: 1.0 },
  breakout: {
    heavyMultiplier: 1.5,
    lightMultiplier: 1.2,
    baseMultiplier: 1.0,
    heavyThreshold: 5,
  },
  scale: { creatorLed: 1.5, viewerLed: 1.0 },
  complexity: { easy: 1.5, medium: 1.2, hard: 1.0 },
  distribution: { perPlatformBoost: 0.2, perMarketBoost: 0.15 },
  freshness: { recentDays: 7, staleDays: 30, stalePenalty: 0.8 },
  quality: { potentialSlopMultiplier: 0.6, slopHidden: true },
  origin: { youtubeShortsBoost: 1.2 },
};

// ============================================================================
// AGENCY UPLOAD TYPES
// ============================================================================

export interface AgencyUploadData {
  topicName: string;
  description: string;
  targetDemo: string;
  referenceLink: string;
  source: string;
}

export interface AgencyUploadResponse {
  success: boolean;
  message: string;
  trendId?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface TrendsResponse {
  trends: Trend[];
  lastUpdated: string;
  totalCount: number;
}

export interface ScoringSettingsResponse {
  config: ScoringConfig;
  updatedAt: string;
  market?: string;
}

export interface DashboardStatsResponse {
  totalActiveTrends: number;
  approvedThisWeek: number;
  lastUpdated: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'country_manager' | 'viewer';
  markets: string[]; // Market codes they have access to
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface TrendFilters {
  market: string;
  targetDemo?: TargetDemo;
  source?: TrendSource | 'All Sources';
  archived?: boolean;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// VIEW STATE TYPES
// ============================================================================

export type TabView = 'summary' | 'deepdive' | 'scoring' | 'archive';
export type AppView = 'dashboard' | 'upload';

// ============================================================================
// ARCHIVE TYPES
// ============================================================================

export interface ArchiveFilters {
  market: string;
  startDate?: Date;
  endDate?: Date;
  source?: TrendSource | 'All Sources';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TREND_SOURCES: TrendSource[] = ['Search', 'Nyan Cat', 'Vayner', 'Agency', 'Music'];

export const TARGET_DEMOS: TargetDemo[] = [
  'All Demographics',
  'Males 13-17',
  'Males 18-24',
  'Males 25-34',
  'Males 35-44',
  'Males 45+',
  'Females 13-17',
  'Females 18-24',
  'Females 25-34',
  'Females 35-44',
  'Females 45+',
];

export const VELOCITY_ICONS = {
  increasing: '↗',
  stable: '→',
  decreasing: '↘',
} as const;

export const VELOCITY_COLORS = {
  increasing: 'text-green-600',
  stable: 'text-muted-foreground',
  decreasing: 'text-orange-600',
} as const;

export const SOURCE_COLORS = {
  Search: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Nyan Cat': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Vayner: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Agency: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Music: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
} as const;
