import { InfoCircledIcon } from '@radix-ui/react-icons';
import type { ReactNode } from 'react';

import Tooltip from '@/components/ui/tooltip';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped, scopedMerge } from '@/theme/mixins';
import type { TooltipPosition } from '@/types/components/common';

type InfoTooltipVariant = 'default' | 'success' | 'warning' | 'caution' | 'critical' | 'info';

type InfoTooltipProps = {
  infoText?: ReactNode;
  children: ReactNode;
  iconPosition?: 'left' | 'right';
  position?: TooltipPosition;
  variant?: InfoTooltipVariant;
};

const InfoTooltip = ({
  infoText,
  children,
  iconPosition = 'right',
  position = 'top',
  variant = 'default',
}: InfoTooltipProps) => {
  if (!infoText) {
    return <>{children}</>;
  }

  return (
    <span css={scoped(styles.wrapper)}>
      {children}
      <Tooltip tip={infoText} position={position}>
        <span
          css={scopedMerge(
            styles.icon,
            styles.iconPositions[iconPosition],
            styles.variants[variant]
          )}
          role="img"
          aria-label={typeof infoText === 'string' ? infoText : undefined}
        >
          <InfoCircledIcon width={16} height={16} />
        </span>
      </Tooltip>
    </span>
  );
};

InfoTooltip.displayName = 'InfoTooltip';

export default InfoTooltip;

const variantStyles = defineStyles({
  default: {
    color: theme.colors.text.secondary,
  },
  success: {
    color: theme.colors.text.success,
  },
  warning: {
    color: theme.colors.text.warning,
  },
  caution: {
    color: theme.colors.text.caution,
  },
  critical: {
    color: theme.colors.text.critical,
  },
  info: {
    color: theme.colors.text.special2,
  },
});

const styles = defineStyles({
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
  },
  icon: {
    ...flexCenter(),
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    flexShrink: 0,
    lineHeight: 0,
  },
  iconPositions: {
    left: {
      left: theme.spacing[2],
    },
    right: {
      right: theme.spacing[2],
    },
  } as const,
  variants: variantStyles,
});
