import type { CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { scopedMerge, scoped, defineStyles } from '@/theme/mixins';
import type { AlertType } from '@/types';

type AlertProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  type?: AlertType;
  icon?: ReactNode;
  text?: ReactNode;
  hasHighlight?: boolean;
  cssOverride?: CSSObject;
};

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  const {
    cssOverride,
    type,
    icon,
    text,
    hasHighlight = false,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      role="alert"
      data-type={type}
      css={scopedMerge(styles.root, cssOverride)}
      {...rest}
    >
      {hasHighlight && <div css={scoped(styles.highlight)} aria-hidden="true" />}
      <Flex gap={2} align="flex-start">
        {icon && (
          <span css={scoped(styles.icon)} aria-hidden="true">
            {icon}
          </span>
        )}
        <span css={scoped(styles.text)}>{text}</span>
      </Flex>
    </div>
  );
});

Alert.displayName = 'Alert';

export default Alert;

const styles = defineStyles({
  root: {
    width: '100%',
    padding: `${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[5]}`,
    borderRadius: `${theme.radius.sm} ${theme.radius.xl} ${theme.radius.xl} ${theme.radius.sm}`,
    backgroundColor: theme.colors.background.fillSecondary,
    position: 'relative',
    overflow: 'hidden',
  },
  highlight: {
    backgroundColor: theme.colors.background.fillBrand,
    height: '100%',
    width: '4px',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  text: {
    maxWidth: '85%',
  },
  icon: {
    flexShrink: 0,
  },
});
