import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import type { Tone } from '@/features/analytics/components/tone-styles';
import { type ChangeDirection, getChangeBadge } from '@/features/analytics/lib/change';
import { theme } from '@/theme';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';

type ChangeBadgeProps = {
  change: number | null | undefined;
};

const TONES: Record<ChangeDirection, Tone> = {
  up: 'success',
  down: 'critical',
  flat: 'neutral',
};

const ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

const ChangeBadge = (props: ChangeBadgeProps) => {
  const badge = getChangeBadge(props.change);

  if (!badge) {
    return null;
  }

  const Icon = ICONS[badge.direction];
  const tone = TONES[badge.direction];

  return (
    <span
      data-testid="change-badge"
      data-direction={badge.direction}
      data-tone={tone}
      css={scoped(mergeCss(styles.text, styles.tones[tone]))}
    >
      <Icon size={16} aria-hidden="true" />
      {badge.text}
    </span>
  );
};

ChangeBadge.displayName = 'ChangeBadge';

export default ChangeBadge;

const styles = defineStyles({
  text: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[1],
    whiteSpace: 'nowrap',
    ...theme.typography.small('medium'),
  },
  tones: {
    success: { color: theme.colors.text.success },
    critical: { color: theme.colors.text.critical },
    neutral: { color: theme.colors.text.subdued },
    warning: { color: theme.colors.text.warning },
  },
});
