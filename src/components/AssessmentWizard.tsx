'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, CheckCircle, Circle, FileText, Upload, MessageCircle, Bot, ClipboardList } from 'lucide-react';
import { AssessmentFormData, WizardStep, AssessmentProgress, MetricType } from '@/types/assessment';
import AssessmentChat from './AssessmentChat';
import AgentChat from './AgentChat';
import InterviewerChat from './InterviewerChat';

interface AssessmentWizardProps {
  sessionId: string;
  pillars: any[];
  initialData?: AssessmentFormData;
  onSave: (data: AssessmentFormData, isComplete?: boolean) => Promise<void>;
  onComplete: (data: AssessmentFormData) => Promise<void>;
}

export function AssessmentWizard({
  sessionId,
  pillars,
  initialData = {},
  onSave,
  onComplete,
}: AssessmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AssessmentFormData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [showAgentChat, setShowAgentChat] = useState(false); // Agent Chat state
  const [showInterviewerChat, setShowInterviewerChat] = useState(false); // NEW: Interviewer Chat state

  // Transform pillars into wizard steps
  const wizardSteps: WizardStep[] = pillars.map((pillar) => ({
    pillarId: pillar.id,
    pillarName: pillar.name,
    category: pillar.category,
    topics: pillar.topics || [],
    isCompleted: isStepCompleted(pillar.id),
    currentTopicIndex: 0,
  }));

  // Calculate progress
  const progress: AssessmentProgress = calculateProgress();

  // Auto-save functionality - save every 10 seconds and when form data changes
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave(false);
    }, 10000); // Auto-save every 10 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [formData, autoSaveEnabled]);

  // Update formData when initialData changes (e.g., when API data loads)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Save immediately when important data changes (with debounce)
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const saveTimer = setTimeout(() => {
      handleSave(false);
    }, 2000); // Save 2 seconds after user stops typing
    
    return () => clearTimeout(saveTimer);
  }, [formData]);

  function isStepCompleted(pillarId: string): boolean {
    const pillar = pillars.find((p) => p.id === pillarId);
    if (!pillar || !pillar.topics) return false;

    return pillar.topics.every((topic: any) =>
      topic.metrics?.filter((metric: any) => metric.active)
        .every((metric: any) => formData[metric.id]?.value !== undefined)
    );
  }

  function calculateProgress(): AssessmentProgress {
    let totalMetrics = 0;
    let completedMetrics = 0;
    const pillarsProgress: any = {};

    pillars.forEach((pillar) => {
      let pillarTotal = 0;
      let pillarCompleted = 0;

      pillar.topics?.forEach((topic: any) => {
        topic.metrics?.filter((metric: any) => metric.active).forEach((metric: any) => {
          pillarTotal++;
          totalMetrics++;
          if (formData[metric.id]?.value !== undefined) {
            pillarCompleted++;
            completedMetrics++;
          }
        });
      });

      pillarsProgress[pillar.id] = {
        completed: pillarCompleted === pillarTotal && pillarTotal > 0,
        topicsCompleted: pillarCompleted,
        totalTopics: pillarTotal,
      };
    });

    return {
      totalSteps: pillars.length,
      completedSteps: Object.values(pillarsProgress).filter((p: any) => p.completed).length,
      currentStep,
      percentageComplete: totalMetrics > 0 ? Math.round((completedMetrics / totalMetrics) * 100) : 0,
      pillarsProgress,
    };
  }

  function handleInputChange(
    metricId: string,
    field: 'value' | 'notes' | 'evidenceUrls',
    value: any
  ) {
    setFormData((prev) => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        [field]: value,
      },
    }));
  }

  async function handleSave(showMessage = true) {
    if (isLoading) return;

    try {
      setIsLoading(true);
      await onSave(formData, false);
      if (showMessage) {
        // You could show a toast message here
        console.log('Assessment saved successfully');
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  }

  async function handleComplete() {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      // Complete the assessment
      await onComplete(formData);
      
      // Trigger maturity calculations for this session
      if (sessionId) {
        const response = await fetch(`/api/assessments/sessions/${sessionId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.warn('Failed to trigger maturity calculations:', await response.text());
        } else {
          console.log('Maturity calculations triggered successfully');
        }
      }
    } catch (error) {
      console.error('Error completing assessment:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }

  function renderMetricInput(metric: any) {
    const value = formData[metric.id]?.value;
    const notes = formData[metric.id]?.notes || '';

    switch (metric.metricType) {
      case 'SCALE':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => {
                // For decimal values, highlight the closest integer
                const isSelected = typeof value === 'number' && Math.round(value) === rating;
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleInputChange(metric.id, 'value', rating)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {rating}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        );

      case 'BOOLEAN':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={metric.id}
                checked={value === true}
                onChange={() => handleInputChange(metric.id, 'value', true)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={metric.id}
                checked={value === false}
                onChange={() => handleInputChange(metric.id, 'value', false)}
                className="w-4 h-4 text-blue-600"
              />
              <span>No</span>
            </label>
          </div>
        );

      case 'PERCENTAGE':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={typeof value === 'number' ? value : 0}
              onChange={(e) => handleInputChange(metric.id, 'value', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>0%</span>
              <span className="font-semibold">{typeof value === 'number' ? value : 0}%</span>
              <span>100%</span>
            </div>
          </div>
        );

      case 'COUNT':
        return (
          <input
            type="number"
            min={metric.minValue}
            max={metric.maxValue}
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => handleInputChange(metric.id, 'value', parseInt(e.target.value) || 0)}
            className="input w-full"
            placeholder={`Enter value (${metric.minValue}-${metric.maxValue})`}
          />
        );

      default:
        return (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleInputChange(metric.id, 'value', e.target.value)}
            className="input w-full"
          />
        );
    }
  }

  const currentPillar = wizardSteps[currentStep];
  const isLastStep = currentStep === wizardSteps.length - 1;
  const canProceed = currentPillar?.isCompleted || false;

  // Handle empty pillars case
  if (!pillars || pillars.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Loading Assessment Framework...
          </h2>
          <p className="text-gray-600 mb-4">
            {pillars === undefined ? 'Loading pillars...' : 'No assessment pillars available.'}
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Enterprise Architecture Assessment
          </h2>
          <div className="flex items-center space-x-4">
            {/* AI Interview Agent Button - NEW! */}
            <button
              onClick={() => setShowInterviewerChat(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              title="Start AI Interview"
            >
              <ClipboardList className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">AI Interview</span>
            </button>

            {/* Talk to Agent Button */}
            <button
              onClick={() => setShowAgentChat(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              title="Talk to AI Agent"
            >
              <Bot className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Talk to Agent</span>
            </button>
            
            {isLoading && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Saving...
              </div>
            )}
            <div className="text-sm text-gray-600">
              {progress.percentageComplete}% Complete
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentageComplete}%` }}
          />
        </div>

        {/* Step Navigator */}
        <div className="flex space-x-2 overflow-x-auto">
          {wizardSteps.map((step, index) => (
            <button
              key={step.pillarId}
              onClick={() => setCurrentStep(index)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                index === currentStep
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : step.isCompleted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {step.isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{step.pillarName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      {currentPillar && (
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentPillar.pillarName}
            </h3>
            <p className="text-gray-600">
              Assess the maturity of your {currentPillar.pillarName.toLowerCase()} practices
            </p>
          </div>

          <div className="space-y-8">
            {currentPillar.topics.map((topic: any) => (
              <div key={topic.id} className="card p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  {topic.name}
                </h4>
                {topic.description && (
                  <p className="text-gray-600 mb-6">{topic.description}</p>
                )}

                <div className="space-y-6">
                  {/* Group metrics by level and show only active ones */}
                  {[1, 2, 3].map((level) => {
                    const levelMetrics = topic.metrics?.filter((metric: any) => 
                      metric.level === level && metric.active
                    ) || [];
                    
                    if (levelMetrics.length === 0) return null;
                    
                    return (
                      <div key={level} className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            level === 1 ? 'bg-red-500' : 
                            level === 2 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}>
                            {level}
                          </div>
                          <h5 className="text-sm font-semibold text-gray-700">
                            Level {level} - {
                              level === 1 ? 'Basic/Initial' : 
                              level === 2 ? 'Intermediate/Managed' : 
                              'Advanced/Optimized'
                            }
                          </h5>
                        </div>
                        
                        {levelMetrics.map((metric: any) => (
                          <div key={metric.id} className={`border-l-4 pl-4 ${
                            level === 1 ? 'border-red-200' : 
                            level === 2 ? 'border-yellow-200' : 
                            'border-green-200'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <label className="text-sm font-medium text-gray-900">
                                  {metric.name}
                                  {metric.weight !== 1.0 && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      (Weight: {metric.weight})
                                    </span>
                                  )}
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                {metric.tags && metric.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {metric.tags.slice(0, 3).map((tag: string, index: number) => (
                                      <span
                                        key={index}
                                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {metric.tags.length > 3 && (
                                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        +{metric.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedMetric(metric);
                                    setShowChat(true);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                                  title="Ask AI Assistant"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  <span className="hidden sm:inline">AI Help</span>
                                </button>
                              </div>
                            </div>
                            
                            {metric.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {metric.description}
                              </p>
                            )}

                            <div className="mb-4">
                              {renderMetricInput(metric)}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                <FileText className="h-4 w-4" />
                                <span>Notes (Optional)</span>
                              </label>
                              <textarea
                                value={formData[metric.id]?.notes || ''}
                                onChange={(e) => handleInputChange(metric.id, 'notes', e.target.value)}
                                placeholder="Add any additional context or explanations..."
                                className="input w-full h-20 resize-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  
                  {/* Show message if no active metrics */}
                  {(!topic.metrics || topic.metrics.filter((m: any) => m.active).length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No active metrics available for this topic.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-6 border-t bg-gray-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={() => handleSave()}
            disabled={isLoading}
            className="flex items-center space-x-2 btn-secondary"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Progress'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {!isLastStep ? (
            <button
              onClick={() => setCurrentStep(Math.min(wizardSteps.length - 1, currentStep + 1))}
              className="flex items-center space-x-2 btn-primary"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isLoading || progress.percentageComplete < 100}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isLoading ? 'Completing...' : 'Complete Assessment'}</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Chat Modal - Existing metric-specific help */}
      {showChat && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl h-[700px] animate-fade-in">
            <AssessmentChat
              metricId={selectedMetric.id}
              sessionId={sessionId}
              metricName={selectedMetric.name}
              projectInfo={formData[selectedMetric.id]?.notes || ''}
              onClose={() => {
                setShowChat(false);
                setSelectedMetric(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Agent Chat Modal - General assessment coaching */}
      {showAgentChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl h-[700px] animate-fade-in">
            <AgentChat
              sessionId={sessionId}
              targetName={pillars[0]?.name || 'Assessment'}
              onClose={() => setShowAgentChat(false)}
            />
          </div>
        </div>
      )}

      {/* NEW: Interviewer Chat Modal - Interactive assessment */}
      {showInterviewerChat && (
        <InterviewerChat
          sessionId={sessionId}
          onClose={() => setShowInterviewerChat(false)}
        />
      )}
    </div>
  );
}