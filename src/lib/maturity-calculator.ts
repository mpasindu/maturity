import {
  MaturityLevel,
  MetricScore,
  TopicScore,
  PillarScore,
  OverallMaturityScore,
  AssessmentConfiguration,
  MetricType,
} from '@/types/assessment';

export class MaturityCalculator {
  private static instance: MaturityCalculator;
  private configuration: AssessmentConfiguration;

  private constructor() {
    this.configuration = this.getDefaultConfiguration();
  }

  public static getInstance(): MaturityCalculator {
    if (!MaturityCalculator.instance) {
      MaturityCalculator.instance = new MaturityCalculator();
    }
    return MaturityCalculator.instance;
  }

  private getDefaultConfiguration(): AssessmentConfiguration {
    return {
      maturityLevels: [
        {
          level: 1,
          name: 'Initial',
          description: 'Ad-hoc processes with minimal documentation',
          min: 0,
          max: 1.5,
          color: '#ff4444',
        },
        {
          level: 2,
          name: 'Developing',
          description: 'Basic processes in place with some documentation',
          min: 1.5,
          max: 2.5,
          color: '#ff8c00',
        },
        {
          level: 3,
          name: 'Defined',
          description: 'Documented and standardized processes',
          min: 2.5,
          max: 3.5,
          color: '#ffd700',
        },
        {
          level: 4,
          name: 'Managed',
          description: 'Measured and controlled processes',
          min: 3.5,
          max: 4.5,
          color: '#90ee90',
        },
        {
          level: 5,
          name: 'Optimized',
          description: 'Continuously improving processes',
          min: 4.5,
          max: 5.0,
          color: '#008000',
        },
      ],
      scoringWeights: {
        pillarWeights: {
          OPERATIONAL_EXCELLENCE: 1.0,
          SECURITY: 1.2,
          NETWORKING: 0.8,
          OPERATIONS: 1.0,
          ARCHITECTURE: 1.1,
        },
        defaultTopicWeight: 1.0,
        defaultMetricWeight: 1.0,
      },
      calculationRules: {
        aggregationMethod: 'WEIGHTED_AVERAGE',
        roundingPrecision: 2,
      },
    };
  }

  /**
   * Calculate maturity score for a single metric
   */
  calculateMetricScore(
    value: number,
    metricType: MetricType,
    minValue: number,
    maxValue: number,
    weight: number
  ): MetricScore {
    let normalizedValue: number;

    switch (metricType) {
      case 'SCALE':
        // Direct scale value (1-5)
        normalizedValue = Math.max(minValue, Math.min(maxValue, value));
        break;
      case 'BOOLEAN':
        // Convert boolean to scale (0 = minValue, 1 = maxValue)
        normalizedValue = value ? maxValue : minValue;
        break;
      case 'PERCENTAGE':
        // Convert percentage to scale
        normalizedValue = (value / 100) * (maxValue - minValue) + minValue;
        break;
      case 'COUNT':
        // Normalize count to scale
        normalizedValue = Math.min(maxValue, (value / 10) * maxValue);
        break;
      default:
        normalizedValue = value;
    }

    return {
      metricId: '',
      metricName: '',
      value: this.roundToDecimalPlaces(normalizedValue, this.configuration.calculationRules.roundingPrecision),
      maxValue,
      weight,
      type: metricType,
    };
  }

  /**
   * Calculate maturity score for a topic
   */
  calculateTopicScore(metricScores: MetricScore[], topicWeight: number): TopicScore {
    if (metricScores.length === 0) {
      return {
        topicId: '',
        topicName: '',
        score: 0,
        maxScore: 5,
        weight: topicWeight,
        metricScores: [],
      };
    }

    const weightedSum = metricScores.reduce(
      (sum, metric) => sum + metric.value * metric.weight,
      0
    );
    const totalWeight = metricScores.reduce((sum, metric) => sum + metric.weight, 0);
    const maxWeightedSum = metricScores.reduce(
      (sum, metric) => sum + metric.maxValue * metric.weight,
      0
    );

    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const maxScore = totalWeight > 0 ? maxWeightedSum / totalWeight : 5;

    return {
      topicId: '',
      topicName: '',
      score: this.roundToDecimalPlaces(score, this.configuration.calculationRules.roundingPrecision),
      maxScore: this.roundToDecimalPlaces(maxScore, this.configuration.calculationRules.roundingPrecision),
      weight: topicWeight,
      metricScores,
    };
  }

  /**
   * Calculate maturity score for a pillar
   */
  calculatePillarScore(topicScores: TopicScore[], pillarWeight: number): PillarScore {
    if (topicScores.length === 0) {
      return {
        pillarId: '',
        pillarName: '',
        category: 'OPERATIONAL_EXCELLENCE',
        score: 0,
        maxScore: 5,
        weight: pillarWeight,
        topicScores: [],
      };
    }

    const weightedSum = topicScores.reduce(
      (sum, topic) => sum + topic.score * topic.weight,
      0
    );
    const totalWeight = topicScores.reduce((sum, topic) => sum + topic.weight, 0);
    const maxWeightedSum = topicScores.reduce(
      (sum, topic) => sum + topic.maxScore * topic.weight,
      0
    );

    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const maxScore = totalWeight > 0 ? maxWeightedSum / totalWeight : 5;

    return {
      pillarId: '',
      pillarName: '',
      category: 'OPERATIONAL_EXCELLENCE',
      score: this.roundToDecimalPlaces(score, this.configuration.calculationRules.roundingPrecision),
      maxScore: this.roundToDecimalPlaces(maxScore, this.configuration.calculationRules.roundingPrecision),
      weight: pillarWeight,
      topicScores,
    };
  }

  /**
   * Calculate overall maturity score
   */
  calculateOverallMaturity(pillarScores: PillarScore[]): OverallMaturityScore {
    if (pillarScores.length === 0) {
      return {
        overallScore: 0,
        maxScore: 5,
        maturityLevel: this.configuration.maturityLevels[0],
        pillarScores: [],
        assessmentDate: new Date(),
        sessionId: '',
      };
    }

    const weightedSum = pillarScores.reduce(
      (sum, pillar) => sum + pillar.score * pillar.weight,
      0
    );
    const totalWeight = pillarScores.reduce((sum, pillar) => sum + pillar.weight, 0);
    const maxWeightedSum = pillarScores.reduce(
      (sum, pillar) => sum + pillar.maxScore * pillar.weight,
      0
    );

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const maxScore = totalWeight > 0 ? maxWeightedSum / totalWeight : 5;
    const maturityLevel = this.determineMaturityLevel(overallScore);

    return {
      overallScore: this.roundToDecimalPlaces(overallScore, this.configuration.calculationRules.roundingPrecision),
      maxScore: this.roundToDecimalPlaces(maxScore, this.configuration.calculationRules.roundingPrecision),
      maturityLevel,
      pillarScores,
      assessmentDate: new Date(),
      sessionId: '',
    };
  }

  /**
   * Determine maturity level based on score
   */
  determineMaturityLevel(score: number): MaturityLevel {
    const level = this.configuration.maturityLevels.find(
      (level) => score >= level.min && score < level.max
    );

    // Handle edge case for maximum score
    if (!level && score >= this.configuration.maturityLevels[this.configuration.maturityLevels.length - 1].min) {
      return this.configuration.maturityLevels[this.configuration.maturityLevels.length - 1];
    }

    return level || this.configuration.maturityLevels[0];
  }

  /**
   * Calculate maturity trends over time
   */
  calculateTrends(historicalScores: Array<{ date: Date; score: number }>): {
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    changeRate: number;
    periodComparison: {
      current: number;
      previous: number;
      change: number;
      changePercentage: number;
    } | null;
  } {
    if (historicalScores.length < 2) {
      return {
        trend: 'STABLE',
        changeRate: 0,
        periodComparison: null,
      };
    }

    const sortedScores = historicalScores.sort((a, b) => a.date.getTime() - b.date.getTime());
    const latest = sortedScores[sortedScores.length - 1];
    const previous = sortedScores[sortedScores.length - 2];

    const change = latest.score - previous.score;
    const changePercentage = previous.score > 0 ? (change / previous.score) * 100 : 0;

    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    if (Math.abs(change) > 0.1) {
      trend = change > 0 ? 'IMPROVING' : 'DECLINING';
    }

    // Calculate average change rate
    const totalChange = latest.score - sortedScores[0].score;
    const totalDays = (latest.date.getTime() - sortedScores[0].date.getTime()) / (1000 * 60 * 60 * 24);
    const changeRate = totalDays > 0 ? totalChange / totalDays : 0;

    return {
      trend,
      changeRate: this.roundToDecimalPlaces(changeRate, 4),
      periodComparison: {
        current: latest.score,
        previous: previous.score,
        change: this.roundToDecimalPlaces(change, this.configuration.calculationRules.roundingPrecision),
        changePercentage: this.roundToDecimalPlaces(changePercentage, 2),
      },
    };
  }

  /**
   * Generate recommendations based on scores
   */
  generateRecommendations(pillarScores: PillarScore[]): Array<{
    pillarId: string;
    pillarName: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    actionItems: string[];
    estimatedEffort: string;
  }> {
    const recommendations: Array<{
      pillarId: string;
      pillarName: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      title: string;
      description: string;
      actionItems: string[];
      estimatedEffort: string;
    }> = [];

    pillarScores.forEach((pillar) => {
      if (pillar.score < 2.5) {
        // Critical improvements needed
        recommendations.push({
          pillarId: pillar.pillarId,
          pillarName: pillar.pillarName,
          priority: 'HIGH' as const,
          title: `Critical Improvement Needed in ${pillar.pillarName}`,
          description: `The ${pillar.pillarName} pillar scored ${pillar.score}/5, indicating significant gaps in maturity.`,
          actionItems: this.getActionItemsForPillar(pillar.category, 'HIGH'),
          estimatedEffort: '3-6 months',
        });
      } else if (pillar.score < 3.5) {
        // Moderate improvements
        recommendations.push({
          pillarId: pillar.pillarId,
          pillarName: pillar.pillarName,
          priority: 'MEDIUM' as const,
          title: `Moderate Improvement Opportunities in ${pillar.pillarName}`,
          description: `The ${pillar.pillarName} pillar scored ${pillar.score}/5, showing room for enhancement.`,
          actionItems: this.getActionItemsForPillar(pillar.category, 'MEDIUM'),
          estimatedEffort: '1-3 months',
        });
      } else if (pillar.score < 4.5) {
        // Minor optimizations
        recommendations.push({
          pillarId: pillar.pillarId,
          pillarName: pillar.pillarName,
          priority: 'LOW' as const,
          title: `Optimization Opportunities in ${pillar.pillarName}`,
          description: `The ${pillar.pillarName} pillar scored ${pillar.score}/5, with opportunities for fine-tuning.`,
          actionItems: this.getActionItemsForPillar(pillar.category, 'LOW'),
          estimatedEffort: '2-4 weeks',
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder: Record<'HIGH' | 'MEDIUM' | 'LOW', number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private getActionItemsForPillar(category: string, priority: 'HIGH' | 'MEDIUM' | 'LOW'): string[] {
    const actionItems: Record<string, Record<string, string[]>> = {
      OPERATIONAL_EXCELLENCE: {
        HIGH: [
          'Establish enterprise architecture governance board',
          'Define architecture standards and principles',
          'Implement architecture review processes',
          'Create compliance monitoring framework',
        ],
        MEDIUM: [
          'Enhance architecture documentation',
          'Improve stakeholder communication',
          'Strengthen change management processes',
        ],
        LOW: [
          'Optimize governance workflows',
          'Enhance reporting mechanisms',
          'Fine-tune approval processes',
        ],
      },
      SECURITY: {
        HIGH: [
          'Implement comprehensive security framework',
          'Establish security governance processes',
          'Deploy security monitoring and incident response',
          'Conduct security risk assessments',
        ],
        MEDIUM: [
          'Enhance security documentation',
          'Improve security training programs',
          'Strengthen access control mechanisms',
        ],
        LOW: [
          'Optimize security workflows',
          'Enhance security reporting',
          'Fine-tune security policies',
        ],
      },
      // Add more categories as needed...
    };

    return actionItems[category]?.[priority] || [
      'Review current practices',
      'Identify improvement opportunities',
      'Implement best practices',
    ];
  }

  private roundToDecimalPlaces(value: number, places: number): number {
    return Math.round(value * Math.pow(10, places)) / Math.pow(10, places);
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<AssessmentConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): AssessmentConfiguration {
    return { ...this.configuration };
  }
}

export default MaturityCalculator;