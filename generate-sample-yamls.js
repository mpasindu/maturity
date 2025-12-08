const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Sample CSV data from the attachment
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
        complexity: 'medium',
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
        'business-impact': 'Medium - Affects application reliability and maintainability',
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
        weight: 1.0,
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
          'Code repository analysis',
          'Developer interviews', 
          'Architecture documentation review'
        ],
        tools: [
          {
            category: 'Code Analysis',
            tools: ['SonarQube', 'CodeClimate']
          }
        ]
      },
      'business-context': {
        'cost-impact': {
          [`level-${row.Level}`]: row.Level === '1' ? 'High maintenance costs' : 
                                  row.Level === '2' ? 'Medium costs' : 'Low costs'
        },
        'success-metrics': [
          {
            name: 'Technical Debt Ratio',
            target: '< 20%'
          }
        ]
      },
      tags: parseTags(row.Tags)
    },
    status: {
      'assessment-status': 'active',
      'last-assessed': new Date().toISOString(),
      'next-assessment': new Date(Date.now() + 90*24*60*60*1000).toISOString(), // 90 days from now
      'current-score': parseInt(row.Level),
      trend: 'stable',
      'confidence-level': 'high'
    }
  };
}

// Generate sample YAML files
csvRows.forEach((row, index) => {
  const metricConfig = generateMetricYAML(row, index);
  const fileName = `${sanitizeId(row.Metric)}.yaml`;
  const filePath = path.join(__dirname, 'yaml-config', 'metrics', fileName);
  
  fs.writeFileSync(filePath, yaml.dump(metricConfig, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  }));
  
  console.log(`Generated: ${fileName}`);
});

console.log('Sample YAML files generated successfully!');