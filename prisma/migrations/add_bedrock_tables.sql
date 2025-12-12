-- Migration: Add AWS Bedrock Agent Integration Tables
-- Created: 2024
-- Purpose: Add tables for Bedrock conversations, messages, recommendations, and evidence analysis

-- Bedrock Conversations Table
-- Stores conversation sessions between users and the Bedrock AI agent
CREATE TABLE IF NOT EXISTS bedrock_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    bedrock_session_id VARCHAR(255) UNIQUE, -- AWS Bedrock session identifier
    context_snapshot JSONB, -- Assessment context at conversation start
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT bedrock_conversations_session_idx UNIQUE (session_id, bedrock_session_id)
);

CREATE INDEX idx_bedrock_conversations_session ON bedrock_conversations(session_id);
CREATE INDEX idx_bedrock_conversations_user ON bedrock_conversations(user_id);
CREATE INDEX idx_bedrock_conversations_status ON bedrock_conversations(status);
CREATE INDEX idx_bedrock_conversations_last_interaction ON bedrock_conversations(last_interaction_at DESC);

-- Bedrock Messages Table
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS bedrock_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES bedrock_conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    message_type VARCHAR(100) CHECK (message_type IN (
        'question', 
        'answer', 
        'recommendation', 
        'clarification', 
        'evidence_analysis',
        'calculation_explanation',
        'best_practice',
        'context_update'
    )),
    
    -- Metadata
    metadata JSONB, -- Additional context (citations, metric references, etc.)
    tokens_used INTEGER,
    model_id VARCHAR(255),
    
    -- Context references
    metric_id UUID REFERENCES metrics(id),
    topic_id UUID REFERENCES assessment_topics(id),
    pillar_id UUID REFERENCES maturity_pillars(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT fk_bedrock_messages_conversation FOREIGN KEY (conversation_id) REFERENCES bedrock_conversations(id)
);

CREATE INDEX idx_bedrock_messages_conversation ON bedrock_messages(conversation_id);
CREATE INDEX idx_bedrock_messages_role ON bedrock_messages(role);
CREATE INDEX idx_bedrock_messages_type ON bedrock_messages(message_type);
CREATE INDEX idx_bedrock_messages_metric ON bedrock_messages(metric_id) WHERE metric_id IS NOT NULL;
CREATE INDEX idx_bedrock_messages_created ON bedrock_messages(created_at DESC);

-- Bedrock Recommendations Table
-- Stores AI-generated recommendations for assessments
CREATE TABLE IF NOT EXISTS bedrock_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES bedrock_conversations(id) ON DELETE SET NULL,
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    
    -- Recommendation details
    recommendation_type VARCHAR(100) NOT NULL CHECK (recommendation_type IN (
        'metric_suggestion',
        'evidence_suggestion',
        'score_guidance',
        'best_practice',
        'improvement_path',
        'risk_mitigation',
        'quick_win'
    )),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    
    -- Context
    metric_id UUID REFERENCES metrics(id),
    topic_id UUID REFERENCES assessment_topics(id),
    pillar_id UUID REFERENCES maturity_pillars(id),
    
    -- Recommendation metadata
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    impact_estimate VARCHAR(100), -- e.g., "Could improve score by 0.5-1.0 points"
    
    -- Supporting evidence from Knowledge Base
    supporting_citations JSONB, -- Array of citations from YAML metrics
    related_metrics UUID[], -- Array of related metric UUIDs
    
    -- User interaction
    user_feedback VARCHAR(50) CHECK (user_feedback IN ('helpful', 'not_helpful', 'applied', NULL)),
    feedback_notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bedrock_recommendations_session ON bedrock_recommendations(session_id);
CREATE INDEX idx_bedrock_recommendations_type ON bedrock_recommendations(recommendation_type);
CREATE INDEX idx_bedrock_recommendations_metric ON bedrock_recommendations(metric_id) WHERE metric_id IS NOT NULL;
CREATE INDEX idx_bedrock_recommendations_priority ON bedrock_recommendations(priority);
CREATE INDEX idx_bedrock_recommendations_confidence ON bedrock_recommendations(confidence_score DESC);

-- Bedrock Evidence Analysis Table
-- Stores AI analysis of user-provided evidence
CREATE TABLE IF NOT EXISTS bedrock_evidence_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES bedrock_conversations(id) ON DELETE SET NULL,
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    
    -- Evidence details
    evidence_text TEXT NOT NULL,
    evidence_urls TEXT[], -- Array of URLs provided by user
    evidence_type VARCHAR(100) CHECK (evidence_type IN (
        'document',
        'screenshot',
        'code_sample',
        'configuration',
        'metrics_data',
        'incident_report',
        'other'
    )),
    
    -- AI Analysis results
    analysis_summary TEXT NOT NULL,
    maturity_level_suggestion INTEGER CHECK (maturity_level_suggestion >= 1 AND maturity_level_suggestion <= 5),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Detailed analysis
    strengths JSONB, -- Array of identified strengths
    gaps JSONB, -- Array of identified gaps
    alignment_score DECIMAL(3,2) CHECK (alignment_score >= 0 AND alignment_score <= 1), -- How well evidence aligns with metric
    
    -- YAML metric alignment
    criteria_matched JSONB, -- Which specific criteria from YAML were matched
    best_practices_referenced JSONB, -- Best practices from knowledge base
    
    -- User interaction
    user_accepted BOOLEAN,
    user_notes TEXT,
    final_score_assigned INTEGER CHECK (final_score_assigned >= 1 AND final_score_assigned <= 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bedrock_evidence_session ON bedrock_evidence_analysis(session_id);
CREATE INDEX idx_bedrock_evidence_metric ON bedrock_evidence_analysis(metric_id);
CREATE INDEX idx_bedrock_evidence_confidence ON bedrock_evidence_analysis(confidence_score DESC);
CREATE INDEX idx_bedrock_evidence_maturity ON bedrock_evidence_analysis(maturity_level_suggestion);
CREATE INDEX idx_bedrock_evidence_accepted ON bedrock_evidence_analysis(user_accepted) WHERE user_accepted IS NOT NULL;

-- Bedrock Knowledge Base Sync Table
-- Tracks synchronization of YAML metrics to Bedrock Knowledge Base
CREATE TABLE IF NOT EXISTS bedrock_knowledge_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(100) NOT NULL CHECK (sync_type IN ('full', 'incremental', 'metric', 'topic', 'pillar')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    
    -- Sync details
    s3_bucket VARCHAR(255),
    s3_prefix VARCHAR(500),
    knowledge_base_id VARCHAR(255),
    data_source_id VARCHAR(255),
    
    -- What was synced
    items_synced INTEGER DEFAULT 0,
    metrics_count INTEGER DEFAULT 0,
    topics_count INTEGER DEFAULT 0,
    pillars_count INTEGER DEFAULT 0,
    
    -- Results
    bedrock_ingestion_job_id VARCHAR(255),
    sync_metadata JSONB, -- Detailed sync results
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bedrock_knowledge_sync_status ON bedrock_knowledge_sync(status);
CREATE INDEX idx_bedrock_knowledge_sync_type ON bedrock_knowledge_sync(sync_type);
CREATE INDEX idx_bedrock_knowledge_sync_started ON bedrock_knowledge_sync(started_at DESC);

-- Add updated_at triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bedrock_conversations_updated_at BEFORE UPDATE ON bedrock_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bedrock_recommendations_updated_at BEFORE UPDATE ON bedrock_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bedrock_evidence_analysis_updated_at BEFORE UPDATE ON bedrock_evidence_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE bedrock_conversations IS 'Stores AWS Bedrock Agent conversation sessions linked to assessment sessions';
COMMENT ON TABLE bedrock_messages IS 'Individual messages exchanged between users and the Bedrock AI agent';
COMMENT ON TABLE bedrock_recommendations IS 'AI-generated recommendations for improving assessments and maturity scores';
COMMENT ON TABLE bedrock_evidence_analysis IS 'AI analysis of user-provided evidence for metric assessments';
COMMENT ON TABLE bedrock_knowledge_sync IS 'Tracks synchronization of YAML metrics to AWS Bedrock Knowledge Base';

COMMENT ON COLUMN bedrock_conversations.bedrock_session_id IS 'AWS Bedrock session identifier for continuity';
COMMENT ON COLUMN bedrock_conversations.context_snapshot IS 'Assessment state snapshot when conversation started';
COMMENT ON COLUMN bedrock_messages.metadata IS 'Citations, metric references, action group results';
COMMENT ON COLUMN bedrock_recommendations.supporting_citations IS 'References to YAML metric criteria and best practices';
COMMENT ON COLUMN bedrock_evidence_analysis.criteria_matched IS 'Specific YAML criteria that evidence satisfies';
