import { AssessmentPageClient } from './AssessmentPageClient';

interface AssessmentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const { id } = await params;
  return <AssessmentPageClient assessmentId={id} />;
}