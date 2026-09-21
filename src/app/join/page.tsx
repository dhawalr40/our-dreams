import { JoinPageClient } from './JoinPageClient';

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <JoinPageClient code={code} />;
}
