import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type Tone = 'success' | 'critical' | 'neutral' | 'warning';

const status = theme.colors.analytics.status;

const toneStyles = defineStyles({
  success: {
    backgroundColor: status.goodBackground,
    color: status.goodText,
  },
  critical: {
    backgroundColor: status.criticalBackground,
    color: status.criticalText,
  },
  neutral: {
    backgroundColor: status.neutralBackground,
    color: status.neutralText,
  },
  warning: {
    backgroundColor: status.warningBackground,
    color: status.warningText,
  },
});

const pillStyles = defineStyles({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing[1],
  padding: `0 ${theme.spacing[2]}`,
  borderRadius: theme.radius.full,
  whiteSpace: 'nowrap',
  ...theme.typography.tiny('semibold'),
});

export { pillStyles, toneStyles };
export type { Tone };
