import { getUserSidebarContent } from '@/lib/api';
import { ProfileClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage() {
  const sidebar = await getUserSidebarContent();
  return <ProfileClient sidebar={sidebar} />;
}
