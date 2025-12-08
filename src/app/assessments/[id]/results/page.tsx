import { ResultsPageClient } from './ResultsPageClient';

export default async function AssessmentResultsPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = await paramsPromise;
  const assessmentId = params.id;
  
  return <ResultsPageClient assessmentId={assessmentId} />;
}
