import { getUserSettingsContent, getUserSidebarContent } from '@/lib/api';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, content] = await Promise.all([getUserSidebarContent(), getUserSettingsContent()]);
  return <SettingsClient sidebar={sidebar} content={content} />;
}
