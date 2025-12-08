# YAML Configuration Documentation

## Overview

This directory contains a comprehensive YAML-based configuration system for the Enterprise Architecture Maturity Assessment platform. The configuration follows Kubernetes-style YAML conventions with extensive metadata and business context.

## File Structure

```
yaml-config/
├── index.yaml                 # Master configuration file
├── pillars/                   # Strategic pillars (5 files)
│   ├── operational-excellence.yaml
│   ├── performance-efficiency.yaml
│   ├── cost-optimization.yaml
│   ├── security.yaml
│   └── reliability.yaml
├── topics/                    # Assessment topics (6 files)
│   ├── application-design.yaml
│   ├── monitoring-observability.yaml
│   ├── data-analytics.yaml
│   ├── cost-management.yaml
│   ├── security-fundamentals.yaml
│   └── reliability-architecture.yaml
└── metrics/                   # Individual metrics (8 files)
    ├── legacy-application-codebase.yaml
    ├── no-redundancy.yaml
    ├── application-redundancy.yaml
    ├── monitoring-basics.yaml
    ├── advanced-analytics.yaml
    ├── cost-optimization.yaml
    ├── security-baseline.yaml
    └── high-availability-design.yaml
```

## YAML Structure

All YAML files follow a consistent structure with four main sections:

### 1. API Version & Kind

```yaml
apiVersion: v1
kind: MaturityPillar|MaturityTopic|MaturityMetric|MaturityAssessmentConfig
```

### 2. Metadata Section

Contains comprehensive information about the configuration item:

```yaml
metadata:
  name: unique-identifier
  uid: structured-id
  namespace: ea-maturity
  labels:
    # Classification labels
  annotations:
    # Rich metadata including descriptions, documentation links, business context
```

**Key Metadata Fields:**

- `display-name`: Human-readable name
- `short-description`: Brief summary (≤100 chars)
- `full-description`: Detailed description
- `documentation`: Link to detailed documentation
- `business-impact`: Impact level and description
- `last-updated`: ISO timestamp
- `maintainer`: Responsible team/person

### 3. Specification Section

Defines the actual configuration and business logic:

```yaml
spec:
  # Core definition
  # Business context
  # Relationships
  # Assessment criteria
  # Implementation details
```

**Common Spec Elements:**

- **business-context**: Strategic objectives, KPIs, frameworks
- **classification**: Hierarchical relationships
- **assessment**: Scoring methods, criteria, frequency
- **implementation**: Practices, tools, success criteria

### 4. Status Section

Runtime information and current state:

```yaml
status:
  assessment-status: active|inactive|pending
  current-maturity: calculated-score
  last-assessed: timestamp
  next-assessment: timestamp
```

## Configuration Types

### Pillars (MaturityPillar)

Strategic focus areas that group related topics and metrics.

**Key Features:**

- Strategic business alignment
- KPIs and success metrics
- Framework mappings (ITIL, DevOps, etc.)
- Governance structure
- Complexity distribution analysis

### Topics (MaturityTopic)

Specific assessment areas within pillars.

**Key Features:**

- Maturity progression levels (1-3)
- Implementation practices and tools
- Parent-child relationships
- Assessment dependencies

### Metrics (MaturityMetric)

Individual measurable items within topics.

**Key Features:**

- Detailed scoring criteria
- Data collection methods
- Business impact analysis
- Risk level assessment
- Remediation strategies

## Business Context Enhancement

Each YAML file includes extensive business context:

### Strategic Alignment

- **Objectives**: Business goals and outcomes
- **KPIs**: Key performance indicators
- **Frameworks**: Industry standards and methodologies
- **Success Metrics**: Measurable targets

### Implementation Details

- **Practices**: Recommended approaches
- **Tools**: Supporting technologies
- **Dependencies**: Prerequisites and relationships
- **Governance**: Ownership and approval processes

### Assessment Information

- **Scoring Methods**: How maturity is calculated
- **Assessment Frequency**: Review cycles
- **Data Sources**: Information collection methods
- **Automation Potential**: Opportunities for automation

## Usage Patterns

### 1. Configuration Loading

The `index.yaml` file serves as the master configuration with references to all other files:

```yaml
references:
  pillars: [list of pillar files]
  topics: [list of topic files]
  metrics: [list of metric files]
```

### 2. Hierarchical Relationships

- Pillars contain multiple topics
- Topics contain multiple metrics
- Relationships are maintained through ID references

### 3. Assessment Workflow

1. Load configuration from YAML files
2. Build assessment hierarchy (Pillar → Topic → Metric)
3. Collect assessment data according to defined criteria
4. Calculate scores using specified methods
5. Generate reports with business context

## Extensibility

The YAML structure supports easy extension:

### Adding New Items

1. Create new YAML file in appropriate directory
2. Follow the established schema structure
3. Update the `index.yaml` references section
4. Include comprehensive metadata and business context

### Customizing Metadata

The annotation system allows for custom metadata:

```yaml
annotations:
  custom-field: custom-value
  integration-endpoint: https://api.example.com
  automation-script: scripts/assess-metric.sh
```

### Framework Integration

The configuration supports integration with various frameworks:

- **TOGAF**: Architecture development method alignment
- **COBIT**: IT governance framework mapping
- **ISO 27001**: Security compliance requirements
- **ITIL**: Service management practices
- **DevOps**: Development and operations integration

## Best Practices

### 1. Naming Conventions

- Use kebab-case for IDs: `application-design`
- Use descriptive display names: `Application Design`
- Maintain consistent terminology across files

### 2. Documentation

- Include comprehensive descriptions
- Provide documentation links
- Explain business context and rationale

### 3. Versioning

- Track configuration changes in metadata
- Use semantic versioning for major updates
- Maintain backward compatibility when possible

### 4. Validation

- Ensure all referenced IDs exist
- Validate YAML syntax
- Check for complete metadata sections

## Integration Points

The YAML configuration integrates with the application in several ways:

### 1. Dynamic Loading

The application can load configuration at runtime, enabling:

- Hot configuration updates
- A/B testing of assessment criteria
- Environment-specific configurations

### 2. API Integration

Configuration serves as the source of truth for:

- Assessment API endpoints
- Scoring algorithms
- Reporting templates

### 3. User Interface

YAML metadata drives UI presentation:

- Display names and descriptions
- Color coding and icons
- Progress indicators
- Help text and documentation links

## Maintenance

### Regular Updates

- Review and update business context quarterly
- Validate assessment criteria with stakeholders
- Update documentation links and references
- Refresh compliance framework mappings

### Quality Assurance

- Validate YAML syntax and structure
- Verify all relationships and references
- Test configuration loading and processing
- Review metadata completeness

This YAML configuration system provides a robust, extensible foundation for the Enterprise Architecture Maturity Assessment platform with comprehensive business context and metadata.
