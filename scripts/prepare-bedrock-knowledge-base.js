/**
 * Prepare Bedrock Knowledge Base
 * 
 * This script prepares YAML metric configurations for upload to AWS Bedrock Knowledge Base.
 * It converts YAML files into structured documents optimized for RAG (Retrieval Augmented Generation).
 * 
 * Features:
 * - Reads all YAML metrics, topics, and pillars
 * - Converts to knowledge base document format
 * - Uploads to S3 bucket for Bedrock ingestion
 * - Tracks sync status in database
 * 
 * Usage:
 *   node scripts/prepare-bedrock-knowledge-base.js [--sync-type=full|incremental]
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { BedrockAgentClient, StartIngestionJobCommand } = require('@aws-sdk/client-bedrock-agent');
const { PrismaClient } = require('@prisma/client');

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET = process.env.BEDROCK_KB_S3_BUCKET || 'maturity-assessment-kb';
const S3_PREFIX = process.env.BEDROCK_KB_S3_PREFIX || 'knowledge-base/';
const KNOWLEDGE_BASE_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID;
const DATA_SOURCE_ID = process.env.BEDROCK_DATA_SOURCE_ID;
const YAML_CONFIG_DIR = path.join(__dirname, '../yaml-config');

// Initialize clients
const s3Client = new S3Client({ region: AWS_REGION });
const bedrockClient = new BedrockAgentClient({ region: AWS_REGION });
const prisma = new PrismaClient();

/**
 * Load all YAML files from a directory
 */
async function loadYamlFiles(directory) {
  const files = await fs.readdir(directory);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  const data = [];
  for (const file of yamlFiles) {
    const filePath = path.join(directory, file);
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = yaml.load(content);
    data.push({
      filename: file,
      ...parsed
    });
  }
  
  return data;
}

/**
 * Convert metric to knowledge base document format
 */
function convertMetricToDocument(metric, topicName, pillarName) {
  const doc = {
    id: metric.id || metric.name.toLowerCase().replace(/\s+/g, '-'),
    type: 'metric',
    pillar: pillarName,
    topic: topicName,
    name: metric.name,
    description: metric.description || '',
    level: metric.level || 1,
    
    // Scoring criteria
    criteria: {},
    
    // Best practices and guidance
    bestPractices: [],
    implementationGuidance: metric.implementationGuidance || [],
    
    // Examples and evidence
    examples: metric.examples || [],
    evidenceTypes: metric.evidenceTypes || [],
    
    // Metadata for search
    tags: metric.tags || [],
    relatedMetrics: metric.relatedMetrics || [],
    
    // Full text for embedding
    fullText: ''
  };
  
  // Extract criteria for each maturity level
  if (metric.criteria) {
    for (let level = 1; level <= 5; level++) {
      const levelKey = `level${level}`;
      if (metric.criteria[levelKey]) {
        doc.criteria[levelKey] = {
          score: level,
          description: metric.criteria[levelKey].description || '',
          requirements: metric.criteria[levelKey].requirements || [],
          characteristics: metric.criteria[levelKey].characteristics || [],
          examples: metric.criteria[levelKey].examples || []
        };
      }
    }
  }
  
  // Extract best practices
  if (metric.bestPractices) {
    doc.bestPractices = Array.isArray(metric.bestPractices) 
      ? metric.bestPractices 
      : Object.values(metric.bestPractices);
  }
  
  // Build full text for better embeddings
  doc.fullText = buildFullText(doc);
  
  return doc;
}

/**
 * Build comprehensive full text for embedding
 */
function buildFullText(doc) {
  let text = `# ${doc.name}\n\n`;
  text += `**Pillar:** ${doc.pillar}\n`;
  text += `**Topic:** ${doc.topic}\n`;
  text += `**Maturity Level:** ${doc.level}\n\n`;
  
  text += `## Description\n${doc.description}\n\n`;
  
  // Add criteria details
  if (Object.keys(doc.criteria).length > 0) {
    text += `## Maturity Level Criteria\n\n`;
    for (const [levelKey, criteria] of Object.entries(doc.criteria)) {
      text += `### Level ${criteria.score} - ${criteria.description}\n`;
      
      if (criteria.requirements.length > 0) {
        text += `**Requirements:**\n`;
        criteria.requirements.forEach(req => text += `- ${req}\n`);
        text += '\n';
      }
      
      if (criteria.characteristics.length > 0) {
        text += `**Characteristics:**\n`;
        criteria.characteristics.forEach(char => text += `- ${char}\n`);
        text += '\n';
      }
      
      if (criteria.examples.length > 0) {
        text += `**Examples:**\n`;
        criteria.examples.forEach(ex => text += `- ${ex}\n`);
        text += '\n';
      }
    }
  }
  
  // Add best practices
  if (doc.bestPractices.length > 0) {
    text += `## Best Practices\n`;
    doc.bestPractices.forEach(bp => {
      if (typeof bp === 'string') {
        text += `- ${bp}\n`;
      } else if (bp.title) {
        text += `### ${bp.title}\n${bp.description || ''}\n\n`;
      }
    });
    text += '\n';
  }
  
  // Add implementation guidance
  if (doc.implementationGuidance.length > 0) {
    text += `## Implementation Guidance\n`;
    doc.implementationGuidance.forEach(guidance => text += `- ${guidance}\n`);
    text += '\n';
  }
  
  // Add examples
  if (doc.examples.length > 0) {
    text += `## Examples\n`;
    doc.examples.forEach(ex => {
      if (typeof ex === 'string') {
        text += `- ${ex}\n`;
      } else if (ex.title) {
        text += `### ${ex.title}\n${ex.description || ''}\n\n`;
      }
    });
  }
  
  return text;
}

/**
 * Upload document to S3
 */
async function uploadToS3(document, filename) {
  const key = `${S3_PREFIX}${filename}`;
  const body = JSON.stringify(document, null, 2);
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'application/json',
    Metadata: {
      type: document.type,
      pillar: document.pillar,
      topic: document.topic,
      level: document.level.toString()
    }
  });
  
  await s3Client.send(command);
  console.log(`✓ Uploaded: ${key}`);
  
  return key;
}

/**
 * Process all YAML configurations
 */
async function processYamlConfigurations() {
  console.log('Loading YAML configurations...\n');
  
  // Load pillars
  const pillarsDir = path.join(YAML_CONFIG_DIR, 'pillars');
  const pillars = await loadYamlFiles(pillarsDir);
  console.log(`Loaded ${pillars.length} pillars`);
  
  // Load topics
  const topicsDir = path.join(YAML_CONFIG_DIR, 'topics');
  const topics = await loadYamlFiles(topicsDir);
  console.log(`Loaded ${topics.length} topics`);
  
  // Load metrics
  const metricsDir = path.join(YAML_CONFIG_DIR, 'metrics');
  const metrics = await loadYamlFiles(metricsDir);
  console.log(`Loaded ${metrics.length} metrics\n`);
  
  const documents = [];
  const uploadedKeys = [];
  
  // Process each metric
  for (const metric of metrics) {
    // Find associated topic and pillar
    const topic = topics.find(t => {
      const metricIds = t.metrics || [];
      return metricIds.some(m => 
        (typeof m === 'string' && m === metric.id) ||
        (typeof m === 'object' && m.id === metric.id)
      );
    });
    
    if (!topic) {
      console.warn(`⚠ No topic found for metric: ${metric.name}`);
      continue;
    }
    
    const pillar = pillars.find(p => p.id === topic.pillar);
    if (!pillar) {
      console.warn(`⚠ No pillar found for topic: ${topic.name}`);
      continue;
    }
    
    // Convert to document
    const doc = convertMetricToDocument(metric, topic.name, pillar.name);
    documents.push(doc);
    
    // Upload to S3
    const filename = `metric-${doc.id}.json`;
    const key = await uploadToS3(doc, filename);
    uploadedKeys.push(key);
  }
  
  // Create index document
  const indexDoc = {
    type: 'index',
    generatedAt: new Date().toISOString(),
    summary: {
      totalMetrics: metrics.length,
      totalTopics: topics.length,
      totalPillars: pillars.length,
      processedMetrics: documents.length
    },
    pillars: pillars.map(p => ({ id: p.id, name: p.name })),
    topics: topics.map(t => ({ id: t.id, name: t.name, pillar: t.pillar })),
    metrics: documents.map(d => ({ 
      id: d.id, 
      name: d.name, 
      pillar: d.pillar, 
      topic: d.topic,
      level: d.level 
    }))
  };
  
  await uploadToS3(indexDoc, 'index.json');
  uploadedKeys.push(`${S3_PREFIX}index.json`);
  
  return {
    documents,
    uploadedKeys,
    counts: {
      metrics: metrics.length,
      topics: topics.length,
      pillars: pillars.length,
      uploaded: uploadedKeys.length
    }
  };
}

/**
 * Start Bedrock ingestion job
 */
async function startIngestionJob() {
  if (!KNOWLEDGE_BASE_ID || !DATA_SOURCE_ID) {
    console.warn('⚠ KNOWLEDGE_BASE_ID or DATA_SOURCE_ID not set. Skipping ingestion.');
    return null;
  }
  
  console.log('\nStarting Bedrock ingestion job...');
  
  const command = new StartIngestionJobCommand({
    knowledgeBaseId: KNOWLEDGE_BASE_ID,
    dataSourceId: DATA_SOURCE_ID
  });
  
  const response = await bedrockClient.send(command);
  console.log(`✓ Ingestion job started: ${response.ingestionJob.ingestionJobId}`);
  
  return response.ingestionJob.ingestionJobId;
}

/**
 * Track sync in database
 */
async function trackSync(syncType, counts, ingestionJobId, error = null) {
  const status = error ? 'FAILED' : (ingestionJobId ? 'IN_PROGRESS' : 'COMPLETED');
  
  const syncRecord = await prisma.bedrockKnowledgeSync.create({
    data: {
      syncType: syncType.toUpperCase(),
      status,
      s3Bucket: S3_BUCKET,
      s3Prefix: S3_PREFIX,
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      dataSourceId: DATA_SOURCE_ID,
      itemsSynced: counts.uploaded,
      metricsCount: counts.metrics,
      topicsCount: counts.topics,
      pillarsCount: counts.pillars,
      bedrockIngestionJobId: ingestionJobId,
      syncMetadata: { counts },
      errorMessage: error?.message,
      completedAt: !ingestionJobId ? new Date() : null
    }
  });
  
  console.log(`\n✓ Sync tracked in database: ${syncRecord.id}`);
  return syncRecord;
}

/**
 * Main execution
 */
async function main() {
  const syncType = process.argv[2]?.replace('--sync-type=', '') || 'full';
  
  console.log('='.repeat(60));
  console.log('Bedrock Knowledge Base Preparation');
  console.log('='.repeat(60));
  console.log(`Sync Type: ${syncType}`);
  console.log(`S3 Bucket: ${S3_BUCKET}`);
  console.log(`S3 Prefix: ${S3_PREFIX}`);
  console.log(`Knowledge Base ID: ${KNOWLEDGE_BASE_ID || 'Not set'}`);
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Process and upload YAML configurations
    const result = await processYamlConfigurations();
    
    console.log('\n' + '='.repeat(60));
    console.log('Upload Summary');
    console.log('='.repeat(60));
    console.log(`Metrics: ${result.counts.metrics}`);
    console.log(`Topics: ${result.counts.topics}`);
    console.log(`Pillars: ${result.counts.pillars}`);
    console.log(`Documents uploaded: ${result.counts.uploaded}`);
    console.log('='.repeat(60));
    
    // Start ingestion job
    const ingestionJobId = await startIngestionJob();
    
    // Track in database
    await trackSync(syncType, result.counts, ingestionJobId);
    
    console.log('\n✓ Knowledge base preparation completed successfully!\n');
    
    if (ingestionJobId) {
      console.log('The ingestion job is running. You can check its status in the AWS Console.');
      console.log(`Job ID: ${ingestionJobId}\n`);
    }
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    
    // Track failed sync
    try {
      await trackSync(syncType, { metrics: 0, topics: 0, pillars: 0, uploaded: 0 }, null, error);
    } catch (dbError) {
      console.error('Failed to track error in database:', dbError.message);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  processYamlConfigurations,
  convertMetricToDocument,
  uploadToS3,
  startIngestionJob
};
