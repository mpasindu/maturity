#!/usr/bin/env node

/**
 * CSV to YAML Converter for Enterprise Architecture Maturity Assessment
 * Converts the CMM-Items.csv data into structured YAML configuration files
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// CSV data from the attachment
const csvData = `Metric,Topics,Level,Piller,Note,Active,Tags
Legacy application codebase,Application design,1,Operational Excellence,"A legacy application codebase refers to the underlying software code of an older application. These codebases are typically aged, challenging to maintain or modify due to outdated technologies, and may face compatibility issues with modern systems. They often require special attention to remain functional and secure amidst rapid technological advancements.",True,"[""Choice 1"",""test"",""test1"",""Backup""]"
No redundancy,Application design,1,Operational Excellence,"Redundancy in application development refers to unnecessary or duplicate elements within the codebase, processes, or resources. It can lead to increased complexity, decreased efficiency, and challenges in maintenance. Minimizing redundancy is crucial for improving performance, scalability, and code maintainability.",True,
Limited understanding of architecture,Application design,1,Operational Excellence,"lack of comprehensive knowledge about the design, structure, and components of a system or software application. This can difficult to get effective decision-making, troubleshooting, and optimization efforts within the architecture.",True,
Updates require large changes without being reversible,Application design,1,Operational Excellence,"When updates necessitate significant changes without offering a way to reverse those changes, it means that once you implement the updates, you can't easily revert back to the previous state if something goes wrong or if the update doesn't work as expected. This lack of reversibility can increase the risk associated with updates, as any issues that arise may require extensive troubleshooting and potentially significant effort to rectify.",True,
Application redundancy,Application design,2,Operational Excellence,"Level 2 application redundancy involves implementing measures like data replication, failover mechanisms, load balancing, and high availability architecture to enhance reliability and minimize downtime. ",True,
Architecture and dependencies defined,Application design,2,Operational Excellence,"Architecture in software refers to the design and structure of a system, while dependencies are the connections between its components. Understanding both is essential for effective development and maintenance.",True,
Updates are frequent small reversible,Application design,2,Operational Excellence,"Frequent, small, reversible updates in software development involve making changes often, in small increments, and ensuring they can be easily undone if necessary. This approach supports agility, reduces risk, improves quality, fosters collaboration, and simplifies reversion of changes.",True,
Follows the 12 factors methodology,Application design,2,Operational Excellence,"Codebase: Maintain one codebase tracked in version control, with multiple deployments as needed.

Dependencies: Explicitly declare and isolate dependencies, avoiding reliance on system-wide libraries.

Config: Store configuration in environment variables, not hardcoded in the codebase.

Backing Services: Treat backing services (like databases, caches) as attached resources accessed via URLs or credentials in the environment.

Build, Release, Run: Clearly separate build, release, and run stages to promote code consistency and reproducibility.

Processes: Execute the application as one or more stateless processes, sharing nothing between instances.

Port Binding: Export services via a port binding, making applications self-contained and portable.

Concurrency: Scale out via the process model, allowing multiple processes to share the workload.

Disposability: Maximize robustness with fast startup and graceful shutdown, handling process failures gracefully.

Dev/Prod Parity: Keep development, staging, and production environments as similar as possible for consistency.

Logs: Treat logs as event streams and write them to stdout, allowing for easy aggregation and analysis.

Admin Processes: Run administrative tasks in the same environment as the application, using one-off processes.",True,
Highly available compute and data tiers,Application design,3,Operational Excellence,"Infrastructure setups designed for uninterrupted access and performance. This includes load balancing, auto-scaling, redundancy, fault tolerance for compute resources, and data replication, backup, scalability, and disaster recovery for data storage. These measures ensure continuous availability, scalability, and resilience for critical applications and services.",True,
Auto-scaling of resources based on demand,Application design,3,Operational Excellence,"Auto-scaling of resources based on demand is a dynamic process where computing resources, such as servers or instances, are automatically adjusted in response to fluctuations in workload or user traffic. This ensures optimal performance during peak usage periods while reducing costs during low-demand times.",True,
Leverages cloud native architecture and services,Application design,3,Operational Excellence,"This approach utilizes cloud-native technologies and principles such as microservices, containers, serverless computing, and managed services. It enables scalability, agility, and efficiency by taking advantage of cloud providers' native capabilities and resources.",True,
Container based compute resources,Application design,3,Operational Excellence,"Container-based compute resources refer to virtualized environments that package and run applications along with their dependencies in isolated containers. These containers share the host operating system's kernel but remain independent and lightweight, providing efficient resource utilization and portability across different computing environments.",True,`;

// Helper functions
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
    // Handle JSON-like tag format
    const cleaned = tagString.replace(/^\[|\]$/g, '').replace(/"/g, '');
    return cleaned.split(',').map(tag => tag.trim()).filter(tag => tag);
  } catch (e) {
    return [];
  }
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"' && (j === 0 || lines[i][j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

// Generate YAML files
function generateYAMLFiles() {
  const data = parseCSV(csvData);
  const pillars = new Map();
  const topics = new Map();
  const metrics = [];
  
  // Process data and organize by pillars and topics
  data.forEach((row, index) => {
    const pillarName = row.Piller;
    const topicName = row.Topics;
    const metricName = row.Metric;
    
    // Organize pillars
    if (!pillars.has(pillarName)) {
      pillars.set(pillarName, {
        id: sanitizeId(pillarName),
        name: pillarName,
        topics: new Set(),
        description: getPillarDescription(pillarName)
      });
    }
    pillars.get(pillarName).topics.add(topicName);
    
    // Organize topics
    const topicKey = `${pillarName}::${topicName}`;
    if (!topics.has(topicKey)) {
      topics.set(topicKey, {
        id: sanitizeId(topicName),
        name: topicName,
        pillarId: sanitizeId(pillarName),
        pillarName: pillarName,
        metrics: [],
        description: getTopicDescription(topicName)
      });
    }
    
    // Add metric
    const metric = {
      id: sanitizeId(metricName),
      name: metricName,
      description: row.Note || '',
      level: parseInt(row.Level) || 1,
      active: row.Active === 'True',
      tags: parseTags(row.Tags),
      topicId: sanitizeId(topicName),
      pillarId: sanitizeId(pillarName),
      uid: `metric-${String(index + 1).padStart(3, '0')}`
    };
    
    topics.get(topicKey).metrics.push(metric.id);
    metrics.push(metric);
  });
  
  // Generate pillar YAML files
  Array.from(pillars.values()).forEach((pillar, index) => {
    const pillarConfig = generatePillarYAML(pillar, index + 1);
    const fileName = `${pillar.id}.yaml`;
    const filePath = path.join(__dirname, 'yaml-config', 'pillars', fileName);
    
    fs.writeFileSync(filePath, yaml.dump(pillarConfig, { 
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    }));
    console.log(`Generated pillar: ${fileName}`);
  });
  
  // Generate topic YAML files
  Array.from(topics.values()).forEach((topic, index) => {
    const topicConfig = generateTopicYAML(topic, index + 1);
    const fileName = `${topic.id}.yaml`;
    const filePath = path.join(__dirname, 'yaml-config', 'topics', fileName);
    
    fs.writeFileSync(filePath, yaml.dump(topicConfig, { 
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    }));
    console.log(`Generated topic: ${fileName}`);
  });
  
  // Generate metric YAML files
  metrics.forEach((metric, index) => {
    const metricConfig = generateMetricYAML(metric);
    const fileName = `${metric.id}.yaml`;
    const filePath = path.join(__dirname, 'yaml-config', 'metrics', fileName);
    
    fs.writeFileSync(filePath, yaml.dump(metricConfig, { 
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    }));
    console.log(`Generated metric: ${fileName}`);
  });
  
  console.log(`\nGenerated ${pillars.size} pillars, ${topics.size} topics, and ${metrics.length} metrics`);
}

function getPillarDescription(pillarName) {
  const descriptions = {
    'Operational Excellence': 'Focus on running and monitoring systems to deliver business value and continually improving processes and procedures',
    'Reliability': 'Ensuring a workload performs its intended function correctly and consistently when it is expected to',
    'Security': 'Protecting information, systems, and assets while delivering business value through risk assessments and mitigation strategies',
    'Performance Efficiency': 'Using IT and computing resources efficiently to meet system requirements and maintain efficiency as demand changes',
    'Cost Optimization': 'Avoiding unnecessary costs and achieving the most cost-effective deployment for your workloads',
    'Sustainability': 'Minimizing the environmental impacts of running cloud workloads through energy-efficient practices'
  };
  return descriptions[pillarName] || 'Enterprise architecture maturity pillar';
}

function getTopicDescription(topicName) {
  const descriptions = {
    'Application design': 'Application architecture, design patterns, and development practices',
    'Monitoring': 'System and application monitoring, alerting, and observability practices',
    'Application performance management': 'Performance monitoring, optimization, and capacity planning',
    'Code deployment': 'Deployment automation, CI/CD pipelines, and release management',
    'Infrastructure provisioning': 'Infrastructure as Code, automation, and resource management',
    'Testing': 'Testing strategies, automation, and quality assurance practices'
  };
  return descriptions[topicName] || 'Assessment topic for enterprise architecture maturity';
}

function generatePillarYAML(pillar, order) {
  return {
    apiVersion: 'v1',
    kind: 'MaturityPillar',
    metadata: {
      name: pillar.id,
      uid: `pillar-${String(order).padStart(3, '0')}`,
      namespace: 'ea-maturity',
      labels: {
        pillar: pillar.id,
        category: 'well-architected',
        priority: order <= 3 ? 'high' : 'medium'
      },
      annotations: {
        'display-name': pillar.name,
        description: pillar.description,
        order: order,
        'last-updated': new Date().toISOString()
      }
    },
    spec: {
      pillar: {
        id: pillar.id,
        name: pillar.name,
        description: pillar.description,
        category: pillar.id.toUpperCase().replace(/-/g, '_')
      },
      configuration: {
        weight: 1.0,
        active: true,
        required: true
      },
      assessment: {
        topics: Array.from(pillar.topics).map(t => sanitizeId(t))
      }
    },
    status: {
      'assessment-status': 'active',
      'topics-count': pillar.topics.size,
      'last-reviewed': new Date().toISOString()
    }
  };
}

function generateTopicYAML(topic, order) {
  return {
    apiVersion: 'v1',
    kind: 'MaturityTopic',
    metadata: {
      name: topic.id,
      uid: `topic-${String(order).padStart(3, '0')}`,
      namespace: 'ea-maturity',
      labels: {
        topic: topic.id,
        pillar: topic.pillarId,
        domain: 'architecture'
      },
      annotations: {
        'display-name': topic.name,
        description: topic.description,
        order: order,
        'last-updated': new Date().toISOString()
      }
    },
    spec: {
      topic: {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        'pillar-id': topic.pillarId
      },
      configuration: {
        'order-index': order,
        weight: 1.0,
        active: true,
        required: true
      },
      assessment: {
        metrics: topic.metrics
      }
    },
    status: {
      'assessment-status': 'active',
      'metrics-count': topic.metrics.length,
      'last-reviewed': new Date().toISOString()
    }
  };
}

function generateMetricYAML(metric) {
  return {
    apiVersion: 'v1',
    kind: 'MaturityMetric',
    metadata: {
      name: metric.id,
      uid: metric.uid,
      namespace: 'ea-maturity',
      labels: {
        metric: metric.id,
        topic: metric.topicId,
        pillar: metric.pillarId,
        level: metric.level.toString(),
        'assessment-type': 'qualitative'
      },
      annotations: {
        'display-name': metric.name,
        'short-description': metric.description.substring(0, 100) + '...',
        'full-description': metric.description,
        'last-updated': new Date().toISOString()
      }
    },
    spec: {
      metric: {
        id: metric.id,
        name: metric.name,
        description: metric.description
      },
      classification: {
        'topic-id': metric.topicId,
        'pillar-id': metric.pillarId,
        level: metric.level,
        'maturity-level': metric.level === 1 ? 'initial' : metric.level === 2 ? 'managed' : 'defined'
      },
      configuration: {
        active: metric.active,
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
          'current-value': metric.level
        }
      },
      tags: metric.tags
    },
    status: {
      'assessment-status': 'active',
      'last-assessed': new Date().toISOString(),
      'current-score': metric.level,
      trend: 'stable'
    }
  };
}

// Make sure directories exist
const dirs = ['yaml-config', 'yaml-config/pillars', 'yaml-config/topics', 'yaml-config/metrics'];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Run the conversion
console.log('Starting CSV to YAML conversion...');
generateYAMLFiles();
console.log('Conversion completed!');

module.exports = { generateYAMLFiles };