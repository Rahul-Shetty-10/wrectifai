import { FindingQuotesPage } from '@/pages/finding-quotes/finding-quotes-page';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ issues?: string; diagnosisRequestId?: string }>;
}) {
  const params = await searchParams;
  return <FindingQuotesPage issues={params.issues} diagnosisRequestId={params.diagnosisRequestId} />;
}
