import type { ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Tooltip from '@/components/ui/tooltip';
import { InfoIcon } from '@/icons/common';

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
        <InfoIcon aria-label={info} role="img" />
      </Tooltip>
    </Flex>
  );
};

OverviewTitle.displayName = 'OverviewTitle';

export default OverviewTitle;
