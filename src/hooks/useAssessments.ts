import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Assessment API functions
async function fetchAssessments() {
  const response = await fetch('/api/assessments');
  if (!response.ok) {
    throw new Error('Failed to load assessments');
  }
  const data = await response.json();
  return data.assessments || [];
}

async function fetchAssessment(id: string) {
  const response = await fetch(`/api/assessments/${id}`);
  if (!response.ok) {
    throw new Error('Failed to load assessment');
  }
  return response.json();
}

async function fetchAssessmentResults(id: string) {
  const response = await fetch(`/api/assessments/${id}/results`);
  if (!response.ok) {
    throw new Error('Failed to load assessment results');
  }
  return response.json();
}

async function fetchPillars() {
  const response = await fetch('/api/pillars');
  if (!response.ok) {
    throw new Error('Failed to load pillars');
  }
  const data = await response.json();
  return data || [];
}

async function createAssessment(data: any) {
  const response = await fetch('/api/assessments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create assessment');
  }
  return response.json();
}

async function updateAssessment(id: string, data: any) {
  const response = await fetch(`/api/assessments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update assessment');
  }
  return response.json();
}

async function deleteAssessment(id: string) {
  const response = await fetch(`/api/assessments/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete assessment');
  }
  return response.json();
}

// Custom hooks
export function useAssessments() {
  return useQuery({
    queryKey: ['assessments'],
    queryFn: fetchAssessments,
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: ['assessment', id],
    queryFn: () => fetchAssessment(id),
    enabled: !!id,
  });
}

export function useAssessmentResults(id: string) {
  return useQuery({
    queryKey: ['assessment-results', id],
    queryFn: () => fetchAssessmentResults(id),
    enabled: !!id,
  });
}

export function usePillars() {
  return useQuery({
    queryKey: ['pillars'],
    queryFn: fetchPillars,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAssessment(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessment', variables.id] });
    },
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}