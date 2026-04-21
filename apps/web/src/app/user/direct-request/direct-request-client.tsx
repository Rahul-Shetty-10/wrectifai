'use client';

import { ServiceIntakeFlow } from '@/components/service-intake/service-intake-flow';
import type { UserServiceIntakeContent, UserSidebarContent } from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserServiceIntakeContent;
};

export function DirectRequestClient({ sidebar, content }: Props) {
  return <ServiceIntakeFlow mode="direct" sidebar={sidebar} content={content} />;
}
