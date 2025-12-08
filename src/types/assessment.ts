// Assessment Domain Types
export type Category = 'OPERATIONAL_EXCELLENCE' | 'RELIABILITY' | 'SECURITY' | 'PERFORMANCE_EFFICIENCY' | 'COST_OPTIMIZATION' | 'SUSTAINABILITY';
export type MetricType = 'SCALE' | 'BOOLEAN' | 'PERCENTAGE' | 'COUNT';
export type TargetType = 'PLATFORM' | 'SYSTEM' | 'APPLICATION';
export type CloudProvider = 'AWS' | 'AZURE' | 'GCP' | 'HYBRID' | 'ON_PREMISE';
export type SessionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type UserRole = 'ADMIN' | 'ASSESSOR' | 'VIEWER';

// Core Entity Interfaces
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaturityPillar {
  id: string;
  name: string;
  description?: string;
  weight: number;
  category: Category;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
  topics?: AssessmentTopic[];
}

export interface AssessmentTopic {
  id: string;
  pillarId: string;
  name: string;
  description?: string;
  weight: number;
  orderIndex?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
  pillar?: MaturityPillar;
  metrics?: Metric[];
}

export interface Metric {
  id: string;
  topicId: string;
  name: string;
  description?: string;
  metricType: MetricType;
  minValue: number;
  maxValue: number;
  weight: number;
  level: number; // Maturity level (1, 2, 3)
  active: boolean; // Whether this metric is currently active
  tags: string[]; // Tags for categorization
  calculationFormula?: string;
  createdAt: Date;
  updatedAt: Date;
  topic?: AssessmentTopic;
}

export interface AssessmentTarget {
  id: string;
  organizationId: string;
  name: string;
  type: TargetType;
  description?: string;
  technologyStack?: Record<string, any>;
  cloudProvider?: CloudProvider;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
}

export interface AssessmentSession {
  id: string;
  targetId: string;
  assessorId: string;
  status: SessionStatus;
  currentPillarId?: string;
  progressData?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  lastModified: Date;
  target?: AssessmentTarget;
  currentPillar?: MaturityPillar;
  assessmentResults?: AssessmentResult[];
}

export interface AssessmentResult {
  id: string;
  sessionId: string;
  metricId: string;
  value: number;
  notes?: string;
  evidenceUrls?: string[];
  assessedAt: Date;
  session?: AssessmentSession;
  metric?: Metric;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Assessment Calculation Types
export interface MaturityLevel {
  level: number;
  name: string;
  description: string;
  min: number;
  max: number;
  color: string;
}

export interface TopicScore {
  topicId: string;
  topicName: string;
  score: number;
  maxScore: number;
  weight: number;
  metricScores: MetricScore[];
}

export interface MetricScore {
  metricId: string;
  metricName: string;
  value: number;
  maxValue: number;
  weight: number;
  type: MetricType;
}

export interface PillarScore {
  pillarId: string;
  pillarName: string;
  category: Category;
  score: number;
  maxScore: number;
  weight: number;
  topicScores: TopicScore[];
}

export interface OverallMaturityScore {
  overallScore: number;
  maxScore: number;
  maturityLevel: MaturityLevel;
  pillarScores: PillarScore[];
  assessmentDate: Date;
  sessionId: string;
}

// Form and UI Types
export interface AssessmentFormData {
  [metricId: string]: {
    value: number | boolean;
    notes?: string;
    evidenceUrls?: string[];
  };
}

export interface WizardStep {
  pillarId: string;
  pillarName: string;
  category: Category;
  topics: AssessmentTopic[];
  isCompleted: boolean;
  currentTopicIndex: number;
}

export interface AssessmentProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  percentageComplete: number;
  pillarsProgress: {
    [pillarId: string]: {
      completed: boolean;
      topicsCompleted: number;
      totalTopics: number;
    };
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Assessment Creation Types
export interface CreateAssessmentRequest {
  targetId: string;
  assessorId: string;
}

export interface UpdateAssessmentRequest {
  sessionId: string;
  results: {
    metricId: string;
    value: number;
    notes?: string;
    evidenceUrls?: string[];
  }[];
  currentPillarId?: string;
  progressData?: Record<string, any>;
}

// Report Types
export interface AssessmentReport {
  sessionId: string;
  targetName: string;
  organizationName: string;
  assessorName: string;
  completedAt: Date;
  overallScore: OverallMaturityScore;
  recommendations: Recommendation[];
  trends?: TrendData[];
}

export interface Recommendation {
  pillarId: string;
  pillarName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionItems: string[];
  estimatedEffort: string;
}

export interface TrendData {
  date: Date;
  overallScore: number;
  pillarScores: {
    [pillarId: string]: number;
  };
}

// Configuration Types
export interface AssessmentConfiguration {
  maturityLevels: MaturityLevel[];
  scoringWeights: {
    pillarWeights: { [category: string]: number };
    defaultTopicWeight: number;
    defaultMetricWeight: number;
  };
  calculationRules: {
    aggregationMethod: 'WEIGHTED_AVERAGE' | 'GEOMETRIC_MEAN' | 'MINIMUM' | 'MAXIMUM';
    roundingPrecision: number;
  };
}

// Error Types
export interface AssessmentError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Export utility type for form validation
export type FormErrors<T> = {
  [K in keyof T]?: string;
};