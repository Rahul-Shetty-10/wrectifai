import { getUserSidebarContent } from '@/lib/api';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sidebar = await getUserSidebarContent();
  return <SettingsClient sidebar={sidebar} />;
}
