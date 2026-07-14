import type { ReactNode } from 'react';

import { useAttributesQuery } from '@/services/attribute';
import { useDefaultSettingsQuery } from '@/services/settings';

type InitProps = {
  children: ReactNode;
};

const Init = ({ children }: InitProps) => {
  useDefaultSettingsQuery();
  useAttributesQuery({ limit: -1 });
  return children;
};

Init.displayName = 'Init';

export default Init;
