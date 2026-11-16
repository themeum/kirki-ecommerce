import type { ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Tooltip from '@/components/ui/tooltip';
import { theme } from '@/theme';
import { Info } from 'lucide-react';

type OverviewTitleProps = {
  info: string;
  children: ReactNode;
};

const OverviewTitle = (props: OverviewTitleProps) => {
  const { info, children } = props;

  return (
    <Flex align="center" gap={1}>
      {children}
      <Tooltip tip={info} position="top">
        <Info size={14} color={theme.colors.icon.secondary} aria-label={info} role="img" />
      </Tooltip>
    </Flex>
  );
};

OverviewTitle.displayName = 'OverviewTitle';

export default OverviewTitle;
