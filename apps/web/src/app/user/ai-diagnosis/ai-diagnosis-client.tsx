'use client';

import { ServiceIntakeFlow } from '@/components/service-intake/service-intake-flow';
import type { UserServiceIntakeContent, UserSidebarContent } from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserServiceIntakeContent;
};

export function AiDiagnosisClient({ sidebar, content }: Props) {
  return <ServiceIntakeFlow mode="diagnosis" sidebar={sidebar} content={content} />;
}
