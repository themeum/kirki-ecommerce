import type { ReactNode } from 'react';

import { pillStyles, type Tone, toneStyles } from '@/features/analytics/components/tone-styles';
import { mergeCss, scoped } from '@/theme/mixins';

type StatusBadgeProps = {
  tone: Tone;
  children: ReactNode;
};

const StatusBadge = (props: StatusBadgeProps) => {
  const { tone, children } = props;

  return (
    <span data-tone={tone} css={scoped(mergeCss(pillStyles, toneStyles[tone]))}>
      {children}
    </span>
  );
};

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
