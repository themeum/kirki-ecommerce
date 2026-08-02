import type { ReactNode } from 'react';

import { AppConfigProvider } from '@/contexts/app-config-context';

type InitProps = {
  children: ReactNode;
};

const Init = ({ children }: InitProps) => {
  return <AppConfigProvider>{children}</AppConfigProvider>;
};

Init.displayName = 'Init';

export default Init;
