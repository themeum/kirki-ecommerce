import type { CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import type { AlertType } from '@/types/components/common';

type AlertProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  type?: AlertType;
  icon?: ReactNode;
  text?: ReactNode;
  hasHighlight?: boolean;
  cssOverride?: CSSObject;
};

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  const { cssOverride, type = 'primary', icon, text, hasHighlight = false, ...rest } = props;

  return (
    <div
      ref={ref}
      role="alert"
      data-type={type}
      css={scopedMerge(styles.root, styles.variants[type], cssOverride)}
      {...rest}
    >
      {hasHighlight && (
        <div css={scoped(styles.highlight)} data-alert-highlight aria-hidden="true" />
      )}
      <Flex gap={2} align="flex-start">
        {icon && (
          <span css={scoped(styles.icon)} aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{text}</span>
      </Flex>
    </div>
  );
});

Alert.displayName = 'Alert';

export default Alert;

const alertVariantStyles = defineStyles({
  primary: {
    backgroundColor: theme.colors.background.fillSecondary,
    '& [data-alert-highlight]': {
      backgroundColor: theme.colors.background.fillBrand,
    },
  },
  success: {
    backgroundColor: theme.colors.background.fillSuccessSecondary,
    '& [data-alert-highlight]': {
      backgroundColor: theme.colors.background.fillSuccess,
    },
  },
  fail: {
    backgroundColor: theme.colors.background.fillCriticalSecondary,
    '& [data-alert-highlight]': {
      backgroundColor: theme.colors.background.fillCritical,
    },
  },
  pending: {
    backgroundColor: theme.colors.background.fillCautionSecondary,
    '& [data-alert-highlight]': {
      backgroundColor: theme.colors.background.fillCaution,
    },
  },
  warning: {
    backgroundColor: theme.colors.background.fillWarningSecondary,
    '& [data-alert-highlight]': {
      backgroundColor: '#FFC207',
    },
  },
});

const styles = defineStyles({
  root: {
    width: '100%',
    padding: `${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[5]}`,
    borderRadius: `${theme.radius.sm} ${theme.radius.xl} ${theme.radius.xl} ${theme.radius.sm}`,
    position: 'relative',
    overflow: 'hidden',
  },
  variants: alertVariantStyles,
  highlight: {
    height: '100%',
    width: '4px',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  icon: {
    flexShrink: 0,
  },
});
