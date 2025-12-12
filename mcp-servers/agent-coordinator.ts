/**
 * Agent Coordinator
 * Manages communication between Coach and Analyst agents
 */

import { AssessmentCoachAgent } from './assessment-coach';
import { ScoringAnalystAgent } from './scoring-analyst';

export interface AgentRequest {
  from: 'coach' | 'analyst' | 'user';
  to: 'coach' | 'analyst';
  action: string;
  data: any;
  timestamp: Date;
}

export interface AgentResponse {
  from: 'coach' | 'analyst';
  to: 'coach' | 'analyst' | 'user';
  data: any;
  timestamp: Date;
  status: 'success' | 'error';
}

export class AgentCoordinator {
  private coachAgent: AssessmentCoachAgent;
  private analystAgent: ScoringAnalystAgent;
  private messageQueue: AgentRequest[] = [];

  constructor(sessionId: string) {
    this.coachAgent = new AssessmentCoachAgent(sessionId);
    this.analystAgent = new ScoringAnalystAgent();
  }

  /**
   * Handle user message - routes to coach agent
   */
  async handleUserMessage(message: string, context?: any): Promise<string> {
    // Coach processes user message
    const coachResponse = await this.processCoachMessage(message, context);
    
    return coachResponse;
  }

  /**
   * Process coach message
   */
  private async processCoachMessage(message: string, context?: any): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Check if coach needs analyst help
    if (lowerMessage.includes('analyze') || lowerMessage.includes('score') || 
        lowerMessage.includes('weakness') || lowerMessage.includes('recommend')) {
      
      // Request analysis from analyst
      const analystResponse = await this.requestAnalystHelp(message, context);
      
      // Coach formats response for user
      return this.formatCoachResponse(analystResponse);
    }

    // Coach handles directly
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
      if (context?.metricId) {
        const explanation = await this.coachAgent.explainMetric(context.metricId);
        return this.formatMetricExplanation(explanation);
      }
    }

    if (lowerMessage.includes('example') || lowerMessage.includes('show me')) {
      if (context?.metricId) {
        const examples = await this.coachAgent.provideExamples(context.metricId, context.level || 2);
        return this.formatExamples(examples);
      }
    }

    if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
      const answers = await this.coachAgent.getCurrentAnswers();
      return this.formatProgress(answers);
    }

    // Default: Get assessment context
    const assessmentContext = await this.coachAgent.getAssessmentContext(context?.metricId);
    return this.formatContextResponse(assessmentContext);
  }

  /**
   * Request help from analyst agent
   */
  private async requestAnalystHelp(query: string, context?: any): Promise<any> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('score') || lowerQuery.includes('analyze')) {
      return await this.analystAgent.calculateFullMaturity(context.sessionId);
    }

    if (lowerQuery.includes('weakness') || lowerQuery.includes('weak')) {
      return await this.analystAgent.identifyWeakAreas(context.sessionId);
    }

    if (lowerQuery.includes('recommend') || lowerQuery.includes('improve')) {
      return await this.analystAgent.generateImprovementPlan(context.sessionId);
    }

    if (lowerQuery.includes('benchmark') || lowerQuery.includes('compare')) {
      return await this.analystAgent.compareToBenchmarks(context.sessionId, context.industry);
    }

    if (lowerQuery.includes('trend') || lowerQuery.includes('history')) {
      return await this.analystAgent.getHistoricalTrends(context.targetId);
    }

    // Default: Full insights
    return await this.analystAgent.generateInsights(context.sessionId);
  }

  /**
   * Format responses for user
   */
  private formatCoachResponse(analystData: any): string {
    // Handle insights/analysis response
    if (analystData.overallScore !== undefined && analystData.maturityLevel !== undefined) {
      const strengthsText = analystData.strengths?.length > 0 
        ? `\n💪 **Strengths:**\n${analystData.strengths.map((s: string) => `• ${s}`).join('\n')}\n` 
        : '';
      
      const weaknessesText = analystData.weaknesses?.length > 0 
        ? `\n⚠️ **Areas for Improvement:**\n${analystData.weaknesses.map((w: string) => `• ${w}`).join('\n')}\n` 
        : '';
      
      const recommendationsText = analystData.recommendations?.length > 0 
        ? `\n🎯 **Top Recommendations:**\n${analystData.recommendations.slice(0, 3).map((r: any, i: number) => {
            // Handle both string and object recommendations
            const recText = typeof r === 'string' ? r : `${r.topic}: ${r.actions?.[0] || 'Improve this area'}`;
            return `${i + 1}. ${recText}`;
          }).join('\n')}\n` 
        : '';

      return `📊 **Assessment Analysis**

Overall Maturity Score: **${analystData.overallScore.toFixed(1)}/3.0** (${analystData.maturityLevel})
${strengthsText}${weaknessesText}${recommendationsText}`;
    }

    // Handle weak areas response
    if (analystData.weakAreas) {
      return `🔍 **Weak Areas Identified**

Found ${analystData.totalIdentified} area(s) below threshold:

${analystData.weakAreas.map((area: any) => 
  `• **${area.pillar}**: ${area.score}/3.0 [${area.severity.toUpperCase()}]`
).join('\n')}`;
    }

    // Handle improvement plan response
    if (analystData.recommendations && Array.isArray(analystData.recommendations)) {
      return `💡 **Improvement Plan**

Overall Score: ${analystData.overallScore?.toFixed(1) || 'N/A'}/3.0

**Priority Actions:**
${analystData.recommendations.map((rec: any, i: number) => 
  `${i + 1}. **${rec.topic}** (Priority: ${rec.priority})
   Current Level: ${rec.currentLevel}
   ${rec.actions.map((a: string) => `   • ${a}`).join('\n')}`
).join('\n\n')}`;
    }

    // Fallback: pretty print JSON
    return '📊 **Analysis Result:**\n\n' + JSON.stringify(analystData, null, 2);
  }

  private formatMetricExplanation(explanation: any): string {
    return `📖 **${explanation.name}**

${explanation.description || 'No description available.'}

**Context:** ${explanation.pillarContext}

**Maturity Levels:**
${Object.entries(explanation.maturityLevels).map(([level, desc]) => 
  `• Level ${level}: ${desc}`
).join('\n')}

**Scoring Guide:** ${explanation.scoringGuide}`;
  }

  private formatExamples(examples: any): string {
    return `💡 **Examples for ${examples.metricName} - Level ${examples.level}**

${examples.examples.map((ex: string, i: number) => `${i + 1}. ${ex}`).join('\n')}`;
  }

  private formatProgress(answers: any[]): string {
    const byPillar: Record<string, number> = {};
    answers.forEach(a => {
      byPillar[a.pillarName] = (byPillar[a.pillarName] || 0) + 1;
    });

    return `📈 **Your Progress**

Total Questions Answered: **${answers.length}**

**By Pillar:**
${Object.entries(byPillar).map(([pillar, count]) => 
  `• ${pillar}: ${count} metric(s)`
).join('\n')}

Keep going! You're making great progress! 🚀`;
  }

  private formatContextResponse(context: any): string {
    if (context.metric) {
      return `📋 **Current Context**

**Pillar:** ${context.pillar.name}
**Topic:** ${context.topic.name}
**Metric:** ${context.metric.name}
**Level:** ${context.metric.level}
**Type:** ${context.metric.metricType}

${context.metric.description || ''}

${context.metric.currentValue !== null ? 
  `Current Answer: ${context.metric.currentValue}` : 
  'Not yet answered'}

${context.metric.notes ? `\nNotes: ${context.metric.notes}` : ''}`;
    }

    return `📊 **Assessment Session**

**Target:** ${context.sessionInfo.targetName}
**Type:** ${context.sessionInfo.targetType}
**Status:** ${context.sessionInfo.status}
**Answered:** ${context.sessionInfo.totalAnswered} questions

Ask me about specific metrics, or say "analyze" to get insights!`;
  }

  /**
   * Get coach agent
   */
  getCoachAgent(): AssessmentCoachAgent {
    return this.coachAgent;
  }

  /**
   * Get analyst agent
   */
  getAnalystAgent(): ScoringAnalystAgent {
    return this.analystAgent;
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.coachAgent.clearHistory();
    this.analystAgent.clearCache();
    this.messageQueue = [];
  }
}
