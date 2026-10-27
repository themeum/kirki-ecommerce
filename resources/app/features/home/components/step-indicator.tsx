import { Check } from 'lucide-react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type StepIndicatorProps = {
  number: number;
  isCompleted: boolean;
  isOpen: boolean;
};

const StepIndicator = ({ number, isCompleted, isOpen }: StepIndicatorProps) => {
  if (isCompleted) {
    return (
      <span
        role="img"
        aria-label={__('Completed', 'kirki-ecommerce')}
        css={scopedMerge(styles.base, styles.completed)}
      >
        <Check size={18} aria-hidden="true" />
      </span>
    );
  }

  return <span css={scopedMerge(styles.base, isOpen && styles.open)}>{number}</span>;
};

StepIndicator.displayName = 'StepIndicator';

export default StepIndicator;

const styles = defineStyles({
  base: {
    ...theme.typography.small('medium'),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '28px',
    height: '28px',
    boxSizing: 'border-box',
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border.default}`,
    backgroundColor: theme.colors.background.surface,
    color: theme.colors.text.primary,
  },
  open: {
    borderColor: 'transparent',
    backgroundColor: theme.colors.background.fillSecondary,
    color: theme.colors.text.emphasis,
  },
  completed: {
    borderColor: 'transparent',
    backgroundColor: theme.colors.background.fillSuccessSecondary,
    color: theme.colors.icon.success,
  },
});
