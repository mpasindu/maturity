const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Extended CSV data sample representing the structure
const csvRows = [
  {
    Metric: "Legacy application codebase",
    Topics: "Application design", 
    Level: "1",
    Piller: "Operational Excellence",
    Note: "A legacy application codebase refers to the underlying software code of an older application. These codebases are typically aged, challenging to maintain or modify due to outdated technologies, and may face compatibility issues with modern systems.",
    Active: "True",
    Tags: '["Choice 1","test","test1","Backup"]'
  },
  {
    Metric: "No redundancy",
    Topics: "Application design",
    Level: "1", 
    Piller: "Operational Excellence",
    Note: "Redundancy in application development refers to unnecessary or duplicate elements within the codebase, processes, or resources.",
    Active: "True",
    Tags: ""
  },
  {
    Metric: "Application redundancy",
    Topics: "Application design",
    Level: "2",
    Piller: "Operational Excellence", 
    Note: "Level 2 application redundancy involves implementing measures like data replication, failover mechanisms, load balancing, and high availability architecture.",
    Active: "True",
    Tags: ""
  },
  {
    Metric: "Monitoring basics",
    Topics: "Monitoring & Observability",
    Level: "1",
    Piller: "Operational Excellence",
    Note: "Basic monitoring involves tracking system performance, uptime, and basic metrics to ensure applications are running properly.",
    Active: "True",
    Tags: '["monitoring","observability"]'
  },
  {
    Metric: "Advanced analytics",
    Topics: "Data Analytics",
    Level: "3",
    Piller: "Performance Efficiency",
    Note: "Advanced analytics capabilities including machine learning, predictive analytics, and real-time data processing.",
    Active: "True",
    Tags: '["analytics","ml","ai"]'
  },
  {
    Metric: "Cost optimization",
    Topics: "Cost Management",
    Level: "2",
    Piller: "Cost Optimization",
    Note: "Implementing cost optimization strategies including resource rightsizing, automated scaling, and cost monitoring.",
    Active: "True",
    Tags: '["cost","optimization"]'
  },
  {
    Metric: "Security baseline",
    Topics: "Security Fundamentals",
    Level: "1",
    Piller: "Security",
    Note: "Basic security measures including authentication, authorization, and basic encryption practices.",
    Active: "True",
    Tags: '["security","baseline"]'
  },
  {
    Metric: "High availability design",
    Topics: "Reliability Architecture",
    Level: "3",
    Piller: "Reliability",
    Note: "Designing systems for high availability with disaster recovery, failover mechanisms, and resilience patterns.",
    Active: "True",
    Tags: '["ha","reliability","dr"]'
  }
];

function sanitizeId(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseTags(tagString) {
  if (!tagString || tagString.trim() === '') return [];
  try {
    return JSON.parse(tagString);
  } catch (e) {
    return [];
  }
}

// Extract unique pillars and topics
const pillars = [...new Set(csvRows.map(row => row.Piller))];
const topics = [...new Set(csvRows.map(row => row.Topics))];

// Generate pillar YAML files
function generatePillarYAML(pillarName, index) {
  const pillarId = sanitizeId(pillarName);
  const relatedTopics = [...new Set(csvRows.filter(row => row.Piller === pillarName).map(row => row.Topics))];
  const relatedMetrics = csvRows.filter(row => row.Piller === pillarName);
  
  // Pillar-specific descriptions and contexts
  const pillarContext = {
    'Operational Excellence': {
      description: 'Focus on running and monitoring systems to deliver business value and continually improve supporting processes and procedures',
      objectives: ['Operational efficiency', 'Automated operations', 'Continuous improvement'],
      kpis: ['System uptime', 'Deployment frequency', 'Mean time to recovery'],
      frameworks: ['ITIL', 'DevOps', 'SRE']
    },
    'Performance Efficiency': {
      description: 'Use computing resources efficiently to meet system requirements and maintain efficiency as demand changes',
      objectives: ['Resource optimization', 'Performance monitoring', 'Scalable architectures'],
      kpis: ['Response time', 'Throughput', 'Resource utilization'],
      frameworks: ['Performance testing', 'Load testing', 'Capacity planning']
    },
    'Cost Optimization': {
      description: 'Avoid unnecessary costs and achieve business outcomes at the lowest price point',
      objectives: ['Cost transparency', 'Resource optimization', 'Financial governance'],
      kpis: ['Cost per transaction', 'Resource efficiency', 'Budget variance'],
      frameworks: ['FinOps', 'Cloud economics', 'TCO analysis']
    },
    'Security': {
      description: 'Protect information, systems, and assets while delivering business value through risk assessments',
      objectives: ['Data protection', 'Identity management', 'Infrastructure protection'],
      kpis: ['Security incidents', 'Compliance score', 'Vulnerability resolution time'],
      frameworks: ['NIST', 'ISO 27001', 'OWASP']
    },
    'Reliability': {
      description: 'Ensure workloads perform their intended function correctly and consistently when expected',
      objectives: ['Fault tolerance', 'Recovery procedures', 'Change management'],
      kpis: ['Availability', 'MTBF', 'MTTR'],
      frameworks: ['Chaos engineering', 'Disaster recovery', 'Business continuity']
    }
  };

  const context = pillarContext[pillarName] || {
    description: `Focus area for ${pillarName} maturity assessment`,
    objectives: ['Continuous improvement', 'Best practices', 'Strategic alignment'],
    kpis: ['Maturity score', 'Implementation progress', 'Business impact'],
    frameworks: ['Industry standards', 'Best practices']
  };

  return {
    apiVersion: 'v1',
    kind: 'MaturityPillar',
    metadata: {
      name: pillarId,
      uid: `pillar-${String(index + 1).padStart(3, '0')}`,
      namespace: 'ea-maturity',
      labels: {
        pillar: pillarId,
        'assessment-type': 'comprehensive',
        priority: index < 2 ? 'high' : 'medium',
        complexity: 'high'
      },
      annotations: {
        'display-name': pillarName,
        'short-description': context.description.substring(0, 100) + '...',
        'full-description': context.description,
        documentation: `https://docs.company.com/pillars/${pillarId}`,
        icon: 'pillar',
        color: `hsl(${(index * 60) % 360}, 70%, 50%)`,
        'last-updated': new Date().toISOString(),
        maintainer: 'architecture-team@company.com',
        'business-impact': 'High - Strategic pillar affecting multiple business outcomes',
        'implementation-complexity': 'High'
      }
    },
    spec: {
      pillar: {
        id: pillarId,
        name: pillarName,
        description: context.description
      },
      'business-context': {
        objectives: context.objectives,
        kpis: context.kpis,
        frameworks: context.frameworks,
        'strategic-importance': 'critical',
        'business-alignment': [
          'Operational efficiency',
          'Risk management', 
          'Strategic growth'
        ]
      },
      structure: {
        'topic-count': relatedTopics.length,
        'metric-count': relatedMetrics.length,
        'complexity-distribution': {
          low: relatedMetrics.filter(m => m.Level === '1').length,
          medium: relatedMetrics.filter(m => m.Level === '2').length,
          high: relatedMetrics.filter(m => m.Level === '3').length
        }
      },
      relationships: {
        topics: relatedTopics.map(topic => ({
          id: sanitizeId(topic),
          name: topic,
          'metric-count': relatedMetrics.filter(m => m.Topics === topic).length
        }))
      },
      assessment: {
        'scoring-method': 'weighted-average',
        'maturity-levels': {
          1: { name: 'Initial', description: 'Ad-hoc processes, limited documentation' },
          2: { name: 'Managed', description: 'Documented processes, some automation' },
          3: { name: 'Defined', description: 'Standardized processes, full automation' }
        },
        'assessment-frequency': 'quarterly'
      },
      governance: {
        owner: 'Architecture Team',
        stakeholders: ['CTO', 'Engineering Leads', 'Operations Team'],
        'review-cycle': 'quarterly',
        'approval-required': true
      }
    },
    status: {
      'assessment-status': 'active',
      'current-maturity': Math.round(relatedMetrics.reduce((sum, m) => sum + parseInt(m.Level), 0) / relatedMetrics.length * 10) / 10,
      'topic-coverage': `${relatedTopics.length} topics`,
      'metric-coverage': `${relatedMetrics.length} metrics`,
      'last-assessed': new Date().toISOString(),
      'next-assessment': new Date(Date.now() + 90*24*60*60*1000).toISOString()
    }
  };
}

// Generate topic YAML files
function generateTopicYAML(topicName, index) {
  const topicId = sanitizeId(topicName);
  const relatedMetrics = csvRows.filter(row => row.Topics === topicName);
  const parentPillar = relatedMetrics[0]?.Piller || 'Unknown';
  const pillarId = sanitizeId(parentPillar);
  
  // Topic-specific contexts
  const topicContext = {
    'Application design': {
      description: 'Architectural patterns, design principles, and application structure considerations',
      practices: ['Clean architecture', 'Design patterns', 'SOLID principles'],
      tools: ['Architecture documentation', 'Design reviews', 'Code analysis']
    },
    'Monitoring & Observability': {
      description: 'System monitoring, logging, tracing, and observability practices',
      practices: ['Distributed tracing', 'Structured logging', 'Metrics collection'],
      tools: ['APM tools', 'Log aggregation', 'Monitoring dashboards']
    },
    'Data Analytics': {
      description: 'Data processing, analytics capabilities, and insights generation',
      practices: ['Data modeling', 'Analytics pipelines', 'Real-time processing'],
      tools: ['Analytics platforms', 'Data lakes', 'BI tools']
    },
    'Cost Management': {
      description: 'Cost optimization, budgeting, and financial governance practices',
      practices: ['Cost allocation', 'Budget monitoring', 'Resource optimization'],
      tools: ['Cost management tools', 'Budget alerts', 'Usage analytics']
    },
    'Security Fundamentals': {
      description: 'Core security practices, policies, and implementation guidelines',
      practices: ['Security by design', 'Threat modeling', 'Security testing'],
      tools: ['Security scanners', 'SIEM', 'Identity management']
    },
    'Reliability Architecture': {
      description: 'System reliability, availability, and resilience design patterns',
      practices: ['Fault tolerance', 'Circuit breakers', 'Graceful degradation'],
      tools: ['Chaos engineering', 'Health checks', 'SLA monitoring']
    }
  };

  const context = topicContext[topicName] || {
    description: `Assessment topic focusing on ${topicName}`,
    practices: ['Best practices', 'Industry standards', 'Continuous improvement'],
    tools: ['Assessment tools', 'Monitoring', 'Documentation']
  };

  return {
    apiVersion: 'v1',
    kind: 'MaturityTopic',
    metadata: {
      name: topicId,
      uid: `topic-${String(index + 1).padStart(3, '0')}`,
      namespace: 'ea-maturity',
      labels: {
        topic: topicId,
        pillar: pillarId,
        'assessment-type': 'detailed',
        complexity: relatedMetrics.length > 3 ? 'high' : 'medium'
      },
      annotations: {
        'display-name': topicName,
        'short-description': context.description.substring(0, 100) + '...',
        'full-description': context.description,
        documentation: `https://docs.company.com/topics/${topicId}`,
        icon: 'topic',
        color: `hsl(${(index * 45) % 360}, 60%, 60%)`,
        'last-updated': new Date().toISOString(),
        maintainer: 'architecture-team@company.com',
        'business-impact': 'Medium - Affects specific capability areas',
        'implementation-effort': 'Medium'
      }
    },
    spec: {
      topic: {
        id: topicId,
        name: topicName,
        description: context.description
      },
      classification: {
        'pillar-id': pillarId,
        'pillar-name': parentPillar,
        category: 'assessment-area',
        'complexity-level': relatedMetrics.length > 3 ? 'high' : 'medium'
      },
      'maturity-progression': {
        levels: [
          {
            level: 1,
            name: 'Initial',
            description: `Basic ${topicName.toLowerCase()} practices in place`,
            characteristics: ['Ad-hoc implementation', 'Limited documentation', 'Manual processes'],
            'typical-practices': context.practices.slice(0, 1)
          },
          {
            level: 2, 
            name: 'Managed',
            description: `Structured ${topicName.toLowerCase()} with defined processes`,
            characteristics: ['Documented procedures', 'Some automation', 'Regular reviews'],
            'typical-practices': context.practices.slice(0, 2)
          },
          {
            level: 3,
            name: 'Defined',
            description: `Optimized ${topicName.toLowerCase()} with continuous improvement`,
            characteristics: ['Standardized processes', 'Full automation', 'Continuous optimization'],
            'typical-practices': context.practices
          }
        ]
      },
      implementation: {
        practices: context.practices,
        tools: context.tools,
        'success-criteria': [
          'Documented processes',
          'Measurable outcomes',
          'Stakeholder alignment'
        ]
      },
      relationships: {
        'parent-pillar': {
          id: pillarId,
          name: parentPillar
        },
        metrics: relatedMetrics.map(metric => ({
          id: sanitizeId(metric.Metric),
          name: metric.Metric,
          level: parseInt(metric.Level),
          active: metric.Active === 'True'
        }))
      },
      assessment: {
        'metric-count': relatedMetrics.length,
        'scoring-method': 'average',
        'assessment-frequency': 'monthly',
        dependencies: []
      }
    },
    status: {
      'assessment-status': 'active',
      'current-maturity': Math.round(relatedMetrics.reduce((sum, m) => sum + parseInt(m.Level), 0) / relatedMetrics.length * 10) / 10,
      'metric-coverage': `${relatedMetrics.length} metrics`,
      'completion-rate': '100%',
      'last-assessed': new Date().toISOString(),
      'next-assessment': new Date(Date.now() + 30*24*60*60*1000).toISOString()
    }
  };
}

// Generate metric YAML files (enhanced version)
function generateMetricYAML(row, index) {
  const metricId = sanitizeId(row.Metric);
  const topicId = sanitizeId(row.Topics);
  const pillarId = sanitizeId(row.Piller);
  
  return {
    apiVersion: 'v1',
    kind: 'MaturityMetric',
    metadata: {
      name: metricId,
      uid: `metric-${String(index + 1).padStart(3, '0')}`,
      namespace: 'ea-maturity',
      labels: {
        metric: metricId,
        topic: topicId,
        pillar: pillarId,
        level: row.Level,
        complexity: parseInt(row.Level) === 3 ? 'high' : parseInt(row.Level) === 2 ? 'medium' : 'low',
        'assessment-type': 'qualitative'
      },
      annotations: {
        'display-name': row.Metric,
        'short-description': row.Note.substring(0, 100) + '...',
        'full-description': row.Note,
        documentation: `https://docs.company.com/metrics/${metricId}`,
        icon: 'metric',
        color: row.Level === '1' ? '#ef4444' : row.Level === '2' ? '#f59e0b' : '#10b981',
        'last-updated': new Date().toISOString(),
        maintainer: 'architecture-team@company.com',
        'business-impact': parseInt(row.Level) === 3 ? 'High' : 'Medium',
        'automation-potential': 'Medium'
      }
    },
    spec: {
      metric: {
        id: metricId,
        name: row.Metric,
        description: row.Note
      },
      classification: {
        'topic-id': topicId,
        'pillar-id': pillarId,
        level: parseInt(row.Level),
        'maturity-level': row.Level === '1' ? 'initial' : row.Level === '2' ? 'managed' : 'defined'
      },
      configuration: {
        active: row.Active === 'True',
        required: true,
        weight: parseInt(row.Level) === 3 ? 1.5 : 1.0,
        'assessment-frequency': 'quarterly'
      },
      assessment: {
        type: 'qualitative',
        method: 'checklist',
        scoring: {
          scale: '1-3',
          'min-value': 1,
          'max-value': 3,
          'current-value': parseInt(row.Level)
        },
        criteria: {
          [`level-${row.Level}`]: {
            score: parseInt(row.Level),
            name: row.Level === '1' ? 'Initial' : row.Level === '2' ? 'Managed' : 'Defined',
            description: row.Note,
            'risk-level': row.Level === '1' ? 'High' : row.Level === '2' ? 'Medium' : 'Low'
          }
        }
      },
      'data-collection': {
        sources: [
          'Documentation review',
          'Technical interviews', 
          'System analysis'
        ],
        tools: [
          {
            category: 'Assessment',
            tools: ['Questionnaires', 'Code analysis', 'Architecture review']
          }
        ]
      },
      'business-context': {
        'cost-impact': {
          [`level-${row.Level}`]: row.Level === '1' ? 'High maintenance costs' : 
                                  row.Level === '2' ? 'Medium costs' : 'Optimized costs'
        },
        'success-metrics': [
          {
            name: `${row.Metric} Score`,
            target: '≥ 2.5'
          }
        ]
      },
      tags: parseTags(row.Tags)
    },
    status: {
      'assessment-status': 'active',
      'last-assessed': new Date().toISOString(),
      'next-assessment': new Date(Date.now() + 90*24*60*60*1000).toISOString(),
      'current-score': parseInt(row.Level),
      trend: 'stable',
      'confidence-level': 'high'
    }
  };
}

// Generate all files
console.log('Generating comprehensive YAML configuration files...\n');

// Generate pillar files
pillars.forEach((pillar, index) => {
  const pillarConfig = generatePillarYAML(pillar, index);
  const fileName = `${sanitizeId(pillar)}.yaml`;
  const filePath = path.join(__dirname, 'yaml-config', 'pillars', fileName);
  
  fs.writeFileSync(filePath, yaml.dump(pillarConfig, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  }));
  
  console.log(`✅ Generated pillar: ${fileName}`);
});

console.log();

// Generate topic files
topics.forEach((topic, index) => {
  const topicConfig = generateTopicYAML(topic, index);
  const fileName = `${sanitizeId(topic)}.yaml`;
  const filePath = path.join(__dirname, 'yaml-config', 'topics', fileName);
  
  fs.writeFileSync(filePath, yaml.dump(topicConfig, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  }));
  
  console.log(`✅ Generated topic: ${fileName}`);
});

console.log();

// Generate metric files
csvRows.forEach((row, index) => {
  const metricConfig = generateMetricYAML(row, index);
  const fileName = `${sanitizeId(row.Metric)}.yaml`;
  const filePath = path.join(__dirname, 'yaml-config', 'metrics', fileName);
  
  fs.writeFileSync(filePath, yaml.dump(metricConfig, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  }));
  
  console.log(`✅ Generated metric: ${fileName}`);
});

// Update the index file with references to all generated files
const indexConfig = {
  apiVersion: 'v1',
  kind: 'MaturityAssessmentConfig',
  metadata: {
    name: 'ea-maturity-assessment',
    uid: 'config-001',
    namespace: 'ea-maturity',
    labels: {
      'config-type': 'master',
      version: 'v1.0.0',
      environment: 'production'
    },
    annotations: {
      'display-name': 'Enterprise Architecture Maturity Assessment',
      'short-description': 'Comprehensive EA maturity assessment configuration with dynamic structure',
      'full-description': 'Complete configuration for enterprise architecture maturity assessment including all pillars, topics, and metrics with comprehensive metadata and business context',
      documentation: 'https://docs.company.com/ea-maturity',
      icon: 'assessment',
      'last-updated': new Date().toISOString(),
      maintainer: 'architecture-team@company.com',
      'business-owner': 'Chief Architect',
      'compliance-frameworks': 'TOGAF, COBIT, ISO 27001'
    }
  },
  spec: {
    assessment: {
      name: 'Enterprise Architecture Maturity Assessment',
      version: '1.0.0',
      description: 'Comprehensive assessment framework for enterprise architecture maturity'
    },
    structure: {
      'pillar-count': pillars.length,
      'topic-count': topics.length,
      'metric-count': csvRows.length,
      'total-assessments': pillars.length + topics.length + csvRows.length
    },
    references: {
      pillars: pillars.map(pillar => ({
        id: sanitizeId(pillar),
        name: pillar,
        file: `pillars/${sanitizeId(pillar)}.yaml`
      })),
      topics: topics.map(topic => ({
        id: sanitizeId(topic),
        name: topic,
        file: `topics/${sanitizeId(topic)}.yaml`
      })),
      metrics: csvRows.map(row => ({
        id: sanitizeId(row.Metric),
        name: row.Metric,
        file: `metrics/${sanitizeId(row.Metric)}.yaml`
      }))
    },
    'business-context': {
      'strategic-objectives': [
        'Improve operational efficiency',
        'Enhance system reliability',
        'Optimize costs',
        'Strengthen security posture',
        'Increase performance'
      ],
      'success-metrics': [
        { name: 'Overall Maturity Score', target: '≥ 2.5' },
        { name: 'Assessment Completion Rate', target: '100%' },
        { name: 'Action Item Resolution', target: '≥ 80%' }
      ]
    }
  },
  status: {
    'config-status': 'active',
    'last-updated': new Date().toISOString(),
    'generated-files': pillars.length + topics.length + csvRows.length,
    version: '1.0.0'
  }
};

const indexPath = path.join(__dirname, 'yaml-config', 'index.yaml');
fs.writeFileSync(indexPath, yaml.dump(indexConfig, {
  lineWidth: 120,
  noRefs: true,
  sortKeys: false
}));

console.log(`\n✅ Updated master index: index.yaml`);

console.log('\n🎉 Complete YAML configuration generated successfully!');
console.log(`\n📊 Summary:`);
console.log(`   Pillars: ${pillars.length} files`);
console.log(`   Topics: ${topics.length} files`);
console.log(`   Metrics: ${csvRows.length} files`);
console.log(`   Total: ${pillars.length + topics.length + csvRows.length + 1} YAML files`);
console.log(`\n📁 All files saved in: yaml-config/`);