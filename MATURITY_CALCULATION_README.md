# Dynamic Maturity Calculation Algorithm

## Overview

The Dynamic Maturity Calculation Algorithm is a comprehensive system for evaluating enterprise architecture maturity across Applications, Systems, and Platforms. It provides weighted calculations, detailed decision tracking, and extensible configuration for enterprise-scale assessments.

## Key Features

### 🎯 Multi-Level Hierarchy

- **Metrics**: Individual assessment points (Level 1, 2, 3)
- **Topics**: Grouped metrics by capability area
- **Pillars**: Strategic domains (Operational Excellence, Security, etc.)
- **Overall**: Weighted aggregate with target-type scaling

### ⚖️ Dynamic Weighting System

- Configurable weights at all levels (Pillar/Topic/Metric)
- Level multipliers for maturity progression
- Target type complexity factors (Application < System < Platform)
- Real-time weight adjustment through API

### 🧠 Decision Tracking & Explanation

- Every calculation decision is recorded with reasoning
- Confidence scoring based on data quality and completeness
- Detailed explanations for audit trails and transparency
- Recommendation engine based on assessment results

### 📊 Comprehensive Analytics

- Trend analysis over time
- Comparison across target types
- Risk factor identification
- Improvement area prioritization

## Algorithm Architecture

### Core Calculation Flow

```
Assessment Data Input
        ↓
1. Metric Score Calculation
   - Apply level multipliers
   - Normalize to scale
   - Weight by importance
        ↓
2. Topic Score Aggregation
   - Weighted average of metrics
   - Apply topic weights
   - Calculate confidence
        ↓
3. Pillar Score Aggregation
   - Weighted average of topics
   - Apply pillar weights
   - Strategic importance factoring
        ↓
4. Overall Score Calculation
   - Weighted average of pillars
   - Apply target type complexity factor
   - Bound to 0-3 scale
        ↓
5. Maturity Level Determination
   - Initial (0-1.3)
   - Managed (1.3-2.0)
   - Defined (2.0-2.7)
   - Optimizing (2.7-3.0)
```

### Configuration System

The algorithm uses a hierarchical configuration system:

```typescript
MaturityCalculationConfig {
  weights: {
    pillar: Record<string, number>     // Strategic pillar weights
    topic: Record<string, number>      // Topic-level weights
    metric: Record<string, number>     // Individual metric weights
  }
  parameters: {
    levelMultipliers: {
      1: 0.33,  // Initial level factor
      2: 0.66,  // Managed level factor
      3: 1.0    // Defined level factor
    }
    confidenceFactors: {
      dataQuality: 0.9
      assessmentRecency: 0.85
      evidenceStrength: 0.8
    }
  }
  targetTypeFactors: {
    APPLICATION: 1.0    // Base complexity
    SYSTEM: 1.15        // +15% complexity
    PLATFORM: 1.3       // +30% complexity
  }
}
```

## Database Schema

### Core Tables

**MaturityCalculation**

- Stores calculation results with full breakdown
- Links to assessment sessions and targets
- Includes algorithm version for compatibility

**CalculationDecision**

- Detailed decision log for each calculation step
- Reasoning, factors, impact level, and confidence
- Enables full audit trail and explanation

**MaturityTrend**

- Time-series data for trend analysis
- Separate tracking for pillars, topics, and metrics
- Supports historical comparison and forecasting

**CalculationConfig**

- Dynamic configuration management
- Versioned weights and parameters
- Target-type specific settings

## API Endpoints

### Calculate Maturity

```http
POST /api/maturity/calculate
Content-Type: application/json

{
  "sessionId": "uuid",
  "targetId": "uuid",
  "targetType": "APPLICATION|SYSTEM|PLATFORM",
  "options": {
    "recalculate": true,
    "configOverrides": { ... }
  }
}
```

### Get Calculation History

```http
GET /api/maturity/calculate?targetId={id}&action=history&limit=10
```

### Get Trend Analysis

```http
GET /api/maturity/calculate?targetId={id}&action=trends&timeframe=quarter
```

### Get Detailed Explanation

```http
GET /api/maturity/calculation/{calculationId}/explanation
```

### Update Configuration

```http
PUT /api/maturity/config
Content-Type: application/json

{
  "configType": "PILLAR_WEIGHT",
  "entityId": "security",
  "weight": 1.5,
  "targetType": "APPLICATION"
}
```

## Usage Examples

### Basic Calculation

```typescript
import { MaturityCalculationService } from "@/lib/maturity-calculation-service";

const service = new MaturityCalculationService(prisma);

const result = await service.calculateMaturity({
  sessionId: "assessment-session-id",
  targetId: "application-id",
  targetType: "APPLICATION",
});

console.log(`Score: ${result.score.overall}/3.0`);
console.log(`Level: ${result.score.level}`);
console.log(`Trend: ${result.trend}`);
```

### Advanced Configuration

```typescript
const result = await service.calculateMaturity({
  sessionId: "assessment-session-id",
  targetId: "platform-id",
  targetType: "PLATFORM",
  options: {
    configOverrides: {
      weights: {
        pillar: {
          security: 2.0, // Double security weight
          "cost-optimization": 0.5, // Reduce cost weight
        },
      },
    },
  },
});
```

### Trend Analysis

```typescript
const trends = await service.getTrendAnalysis("target-id", "quarter");

console.log("Overall trend:", trends.overall);
console.log("Pillar trends:", trends.pillars);
console.log("Security pillar trend:", trends.pillars["security"]);
```

## Key Algorithms

### Weighted Average Calculation

```typescript
function calculateWeightedAverage(items: ScoredItem[]): number {
  const totalWeightedScore = items.reduce(
    (sum, item) => sum + item.score * item.weight,
    0
  );
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  return totalWeightedScore / totalWeight;
}
```

### Confidence Calculation

```typescript
function calculateConfidence(
  dataCompleteness: number,
  assessmentRecency: number,
  evidenceQuality: number
): number {
  return (
    dataCompleteness * 0.5 + assessmentRecency * 0.3 + evidenceQuality * 0.2
  );
}
```

### Level Determination

```typescript
function determineMaturityLevel(score: number): MaturityLevel {
  if (score >= 2.7) return "Optimizing";
  if (score >= 2.0) return "Defined";
  if (score >= 1.3) return "Managed";
  return "Initial";
}
```

## Extension to Systems and Platforms

### Scaling Strategy

The algorithm extends from Applications to Systems and Platforms through:

1. **Complexity Factors**: Higher multipliers for Systems (1.15x) and Platforms (1.3x)
2. **Additional Metrics**: More comprehensive assessment criteria for larger scopes
3. **Extended Assessment Cycles**: Longer intervals for complex targets
4. **Enhanced Dependencies**: Cross-system and platform-level dependencies

### System-Level Extensions

For **Systems** (collections of applications):

- Integration maturity metrics
- Data flow and API governance
- Cross-application consistency
- System-wide monitoring and alerting

For **Platforms** (foundational infrastructure):

- Multi-tenancy and scalability
- Platform governance and standards
- Developer experience and productivity
- Platform reliability and SLA management

### Implementation Pattern

```typescript
// Application Assessment (Base)
const appConfig = {
  targetTypeFactors: { APPLICATION: 1.0 },
  assessmentScope: ["code", "architecture", "deployment"],
  cyclePeriod: "3-months",
};

// System Assessment (Extended)
const systemConfig = {
  targetTypeFactors: { SYSTEM: 1.15 },
  assessmentScope: [
    "integration",
    "data-flow",
    "governance",
    ...appConfig.assessmentScope,
  ],
  cyclePeriod: "6-months",
};

// Platform Assessment (Comprehensive)
const platformConfig = {
  targetTypeFactors: { PLATFORM: 1.3 },
  assessmentScope: [
    "tenancy",
    "standards",
    "dx",
    "sla",
    ...systemConfig.assessmentScope,
  ],
  cyclePeriod: "12-months",
};
```

## Best Practices

### Configuration Management

- Use version control for configuration changes
- Test weight adjustments with historical data
- Document rationale for custom weights
- Regular review of calculation parameters

### Assessment Quality

- Ensure comprehensive evidence collection
- Regular assessor training and calibration
- Validate results with stakeholder feedback
- Maintain assessment consistency over time

### Performance Optimization

- Cache calculation configurations
- Use database indexing for trend queries
- Implement async processing for large assessments
- Monitor calculation performance metrics

### Audit and Compliance

- Maintain complete decision audit trails
- Regular algorithm validation and testing
- Document methodology for compliance reviews
- Version control for algorithm changes

## Testing

Run the comprehensive test suite:

```bash
# Unit tests
npm test src/lib/maturity-calculation-engine.test.ts

# Integration tests
npm test src/lib/maturity-calculation-service.test.ts

# End-to-end API tests
npm test src/app/api/maturity/calculate/route.test.ts
```

Sample test execution:

```typescript
import { runMaturityCalculationTests } from "@/lib/maturity-calculation-test";

const results = await runMaturityCalculationTests();
console.log("Test Results:", results);
```

## Future Enhancements

### Planned Features

- Machine learning-based weight optimization
- Predictive maturity modeling
- Benchmark comparison with industry standards
- Real-time calculation streaming
- Advanced visualization and reporting

### Scalability Improvements

- Distributed calculation processing
- Caching layer for configuration
- Database sharding for large enterprises
- API rate limiting and throttling

---

_This algorithm provides the foundation for comprehensive enterprise architecture maturity assessment with the flexibility to scale from individual applications to entire platform ecosystems._
