// Mock data for development when database is not available
export const mockOrganization = {
  id: 'org-1',
  name: 'Example Corporation',
  description: 'A sample organization for testing',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockPillars = [
  {
    id: 'pillar-1',
    name: 'Operational Excellence',
    description: 'Focus on running and monitoring systems to deliver business value and continually improving processes and procedures',
    category: 'OPERATIONAL_EXCELLENCE',
    weight: 1.0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    topics: [
      {
        id: 'topic-1',
        name: 'Application design',
        description: 'Application architecture, design patterns, and development practices',
        pillarId: 'pillar-1',
        weight: 1.2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metrics: [
          {
            id: 'metric-1',
            name: 'Legacy application codebase',
            description: 'A legacy application codebase refers to the underlying software code of an older application. These codebases are typically aged, challenging to maintain or modify due to outdated technologies, and may face compatibility issues with modern systems.',
            topicId: 'topic-1',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: true,
            tags: ['Choice 1', 'test', 'test1', 'Backup'],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-2',
            name: 'No redundancy',
            description: 'Redundancy in application development refers to unnecessary or duplicate elements within the codebase, processes, or resources. It can lead to increased complexity, decreased efficiency, and challenges in maintenance.',
            topicId: 'topic-1',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-3',
            name: 'Limited understanding of architecture',
            description: 'Lack of comprehensive knowledge about the design, structure, and components of a system or software application.',
            topicId: 'topic-1',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-4',
            name: 'Application redundancy',
            description: 'Level 2 application redundancy involves implementing measures like data replication, failover mechanisms, load balancing, and high availability architecture to enhance reliability.',
            topicId: 'topic-1',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 2,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-5',
            name: 'Follows the 12 factors methodology',
            description: 'Twelve-factor methodology is a methodology for building software-as-a-service applications with best practices for modern cloud applications.',
            topicId: 'topic-1',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 2,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-6',
            name: 'Highly available compute and data tiers',
            description: 'Infrastructure setups designed for uninterrupted access and performance including load balancing, auto-scaling, redundancy, and fault tolerance.',
            topicId: 'topic-1',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 3,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      },
      {
        id: 'topic-2',
        name: 'Monitoring',
        description: 'System monitoring, alerting, and observability practices',
        pillarId: 'pillar-1',
        weight: 1.1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metrics: [
          {
            id: 'metric-7',
            name: 'Limited reactive monitoring',
            description: 'Basic monitoring capabilities with limited reactive responses',
            topicId: 'topic-2',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-8',
            name: 'Application level reactive monitoring',
            description: 'Monitoring at the application level with reactive capabilities',
            topicId: 'topic-2',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 2,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-9',
            name: 'Proactive event identification',
            description: 'Advanced monitoring with proactive event identification and response',
            topicId: 'topic-2',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 3,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      },
    ],
  },
  {
    id: 'pillar-2',
    name: 'Reliability',
    description: 'The ability to recover from failures and to dynamically meet demand and to mitigate disruptions',
    category: 'RELIABILITY',
    weight: 1.1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    topics: [
      {
        id: 'topic-3',
        name: 'Designed for reliability',
        description: 'System design patterns and practices for reliability',
        pillarId: 'pillar-2',
        weight: 1.3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metrics: [
          {
            id: 'metric-10',
            name: 'No redundancy',
            description: 'Systems lack redundancy mechanisms',
            topicId: 'topic-3',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-11',
            name: 'Core services have redundancy',
            description: 'Critical services implement redundancy patterns',
            topicId: 'topic-3',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 2,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-12',
            name: 'All dependencies have redundancy',
            description: 'Comprehensive redundancy across all system dependencies',
            topicId: 'topic-3',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 3,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      },
    ],
  },
  {
    id: 'pillar-3',
    name: 'Security',
    description: 'Protecting information and systems through identity management, access controls, and network protection',
    category: 'SECURITY',
    weight: 1.2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    topics: [
      {
        id: 'topic-4',
        name: 'Identity Management',
        description: 'Identity and access management practices',
        pillarId: 'pillar-3',
        weight: 1.2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metrics: [
          {
            id: 'metric-13',
            name: 'Identity processes are inconsistent',
            description: 'Identity management processes lack consistency',
            topicId: 'topic-4',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: false,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-14',
            name: 'Role-base access control manages access',
            description: 'Implementation of role-based access control systems',
            topicId: 'topic-4',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 2,
            active: false,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      },
      {
        id: 'topic-5',
        name: 'Secret Management',
        description: 'Management of secrets, keys, and sensitive configuration',
        pillarId: 'pillar-3',
        weight: 1.1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metrics: [
          {
            id: 'metric-15',
            name: 'No Secrets Management and/or Secrets stored in code',
            description: 'Secrets are not properly managed or stored in code repositories',
            topicId: 'topic-5',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: false,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-16',
            name: 'Secrets onboarded to a Secrets Management solution',
            description: 'Secrets are managed through dedicated secret management solutions',
            topicId: 'topic-5',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 2,
            active: false,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      },
    ],
  },
  {
    id: 'pillar-4',
    name: 'Performance Efficiency',
    description: 'Using IT and computing resources efficiently to meet system requirements and maintain efficiency as demand changes',
    category: 'PERFORMANCE_EFFICIENCY',
    weight: 1.0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    topics: [
      {
        id: 'topic-6',
        name: 'Performance principles managed',
        description: 'Application and management of performance principles',
        pillarId: 'pillar-4',
        weight: 1.2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metrics: [
          {
            id: 'metric-17',
            name: 'No application of principles',
            description: 'Performance principles are not systematically applied',
            topicId: 'topic-6',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      },
    ],
  },
  {
    id: 'pillar-5',
    name: 'Cost Optimization',
    description: 'Running systems to deliver business value at the lowest price point and avoiding unnecessary costs',
    category: 'COST_OPTIMIZATION',
    weight: 1.0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    topics: [
      {
        id: 'topic-7',
        name: 'Cost model developed',
        description: 'Development and implementation of cost management models',
        pillarId: 'pillar-5',
        weight: 1.1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metrics: [
          {
            id: 'metric-18',
            name: 'No costs are itemized',
            description: 'Costs are not properly tracked or itemized',
            topicId: 'topic-7',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      },
    ],
  },
  {
    id: 'pillar-6',
    name: 'Sustainability',
    description: 'Focusing on environmental impacts, especially energy consumption and efficiency over the full workload lifecycle',
    category: 'SUSTAINABILITY',
    weight: 1.0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    topics: [
      {
        id: 'topic-8',
        name: 'Resource efficiency management',
        description: 'Management of resource efficiency and scaling',
        pillarId: 'pillar-6',
        weight: 1.1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metrics: [
          {
            id: 'metric-19',
            name: 'No scaling resources for load',
            description: 'Resources are not scaled based on load requirements',
            topicId: 'topic-8',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 1,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'metric-20',
            name: 'Automatic scaling of resources based on load',
            description: 'Resources automatically scale based on load patterns',
            topicId: 'topic-8',
            metricType: 'SCALE',
            minValue: 1,
            maxValue: 3,
            weight: 1.0,
            level: 3,
            active: true,
            tags: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      },
    ],
  },
];

export const mockAssessments = [
  {
    id: 'assessment-1',
    name: 'Q1 2024 EA Assessment',
    organizationId: 'org-1',
    organization: mockOrganization,
    targetId: null,
    currentPillarId: null,
    progressData: {},
    status: 'COMPLETED',
    startedAt: new Date('2024-01-15'),
    completedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'assessment-2',
    name: 'Q2 2024 EA Assessment',
    organizationId: 'org-1',
    organization: mockOrganization,
    targetId: null,
    currentPillarId: 'pillar-2',
    progressData: { completedPillars: ['pillar-1'] },
    status: 'IN_PROGRESS',
    startedAt: new Date('2024-04-01'),
    completedAt: null,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-05'),
  },
];

// Sample assessment results for completed assessment
export const mockAssessmentResults = [
  { id: 'result-1', sessionId: 'assessment-1', metricId: 'metric-1', value: 4, notes: 'Good documentation practices', evidenceUrls: [], assessedAt: new Date('2024-01-15') },
  { id: 'result-2', sessionId: 'assessment-1', metricId: 'metric-2', value: 85, notes: 'Most projects follow standards', evidenceUrls: [], assessedAt: new Date('2024-01-15') },
  { id: 'result-3', sessionId: 'assessment-1', metricId: 'metric-3', value: 1, notes: 'ARB meets weekly', evidenceUrls: [], assessedAt: new Date('2024-01-15') },
  { id: 'result-4', sessionId: 'assessment-1', metricId: 'metric-4', value: 1, notes: 'NIST framework adopted', evidenceUrls: [], assessedAt: new Date('2024-01-15') },
  { id: 'result-5', sessionId: 'assessment-1', metricId: 'metric-5', value: 60, notes: 'Partial Zero Trust implementation', evidenceUrls: [], assessedAt: new Date('2024-01-15') },
  { id: 'result-6', sessionId: 'assessment-1', metricId: 'metric-6', value: 3, notes: 'Basic segmentation in place', evidenceUrls: [], assessedAt: new Date('2024-01-15') },
  { id: 'result-7', sessionId: 'assessment-1', metricId: 'metric-7', value: 1, notes: 'ELK stack implemented', evidenceUrls: [], assessedAt: new Date('2024-01-15') },
  { id: 'result-8', sessionId: 'assessment-1', metricId: 'metric-8', value: 1, notes: 'Following TOGAF ADM', evidenceUrls: [], assessedAt: new Date('2024-01-15') },
];

export const mockRecommendations = [
  {
    id: 'rec-1',
    title: 'Improve Zero Trust Implementation',
    description: 'Expand Zero Trust architecture to cover more infrastructure components',
    priority: 'HIGH',
    pillarId: 'pillar-2',
    estimatedEffort: 'High',
    expectedImpact: 'Significant security posture improvement',
  },
  {
    id: 'rec-2',
    title: 'Enhance Network Segmentation',
    description: 'Implement more granular network segmentation for better security isolation',
    priority: 'MEDIUM',
    pillarId: 'pillar-3',
    estimatedEffort: 'Medium',
    expectedImpact: 'Improved security and compliance',
  },
  {
    id: 'rec-3',
    title: 'Establish Architecture Training Program',
    description: 'Create formal training program for architecture standards and processes',
    priority: 'MEDIUM',
    pillarId: 'pillar-1',
    estimatedEffort: 'Medium',
    expectedImpact: 'Better standards compliance',
  },
];

// In-memory storage for mock data
// Using globalThis to persist across hot reloads in development
const globalForAssessments = globalThis as unknown as {
  assessmentStorage: typeof mockAssessments;
  resultsStorage: typeof mockAssessmentResults;
};

let assessmentStorage = globalForAssessments.assessmentStorage ?? [...mockAssessments];
let resultsStorage = globalForAssessments.resultsStorage ?? [...mockAssessmentResults];

// Persist in global scope for development
if (process.env.NODE_ENV === 'development') {
  globalForAssessments.assessmentStorage = assessmentStorage;
  globalForAssessments.resultsStorage = resultsStorage;
}

export function getAssessments() {
  return assessmentStorage;
}

export function getAssessment(id: string) {
  console.log('getAssessment called with id:', id);
  console.log('Available assessments:', assessmentStorage.map(a => a.id));
  const assessment = assessmentStorage.find(a => a.id === id);
  
  if (assessment) {
    // Get saved responses for this assessment
    const savedResults = getAssessmentResults(id);
    const responses: any = {};
    
    // Convert saved results back to the expected format
    savedResults.forEach(result => {
      responses[result.metricId] = {
        value: result.value,
        notes: result.notes,
        evidenceUrls: result.evidenceUrls
      };
    });
    
    // Return assessment with responses included
    return {
      ...assessment,
      responses
    };
  }
  
  return undefined;
}

export function createAssessment(data: any) {
  const newAssessment = {
    id: `assessment-${Date.now()}`,
    ...data,
    organizationId: 'org-1',
    organization: mockOrganization,
    targetId: null,
    currentPillarId: null,
    progressData: {},
    status: 'DRAFT',
    startedAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  console.log('Creating new assessment with id:', newAssessment.id);
  assessmentStorage.push(newAssessment);
  
  // Update global storage in development
  if (process.env.NODE_ENV === 'development') {
    globalForAssessments.assessmentStorage = assessmentStorage;
  }
  
  console.log('Assessment storage now has:', assessmentStorage.length, 'assessments');
  return newAssessment;
}

export function updateAssessment(id: string, data: any) {
  const index = assessmentStorage.findIndex(a => a.id === id);
  if (index !== -1) {
    assessmentStorage[index] = {
      ...assessmentStorage[index],
      ...data,
      updatedAt: new Date(),
    };
    return assessmentStorage[index];
  }
  return null;
}

export function deleteAssessment(id: string) {
  const index = assessmentStorage.findIndex(a => a.id === id);
  if (index !== -1) {
    assessmentStorage.splice(index, 1);
    // Also remove related results
    resultsStorage = resultsStorage.filter(r => r.sessionId !== id);
    return true;
  }
  return false;
}

export function getAssessmentResults(sessionId: string) {
  return resultsStorage.filter(r => r.sessionId === sessionId);
}

export function saveAssessmentResults(sessionId: string, responses: any) {
  // Remove existing results for this session
  resultsStorage = resultsStorage.filter(r => r.sessionId !== sessionId);
  
  // Add new results
  Object.entries(responses).forEach(([metricId, response]: [string, any]) => {
    if (response?.value !== undefined) {
      resultsStorage.push({
        id: `result-${sessionId}-${metricId}`,
        sessionId,
        metricId,
        value: response.value,
        notes: response.notes || '',
        evidenceUrls: response.evidenceUrls || [],
        assessedAt: new Date(),
      });
    }
  });
}