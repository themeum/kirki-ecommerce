import type { SerializedStyles } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { AlertType } from '@/types';

type AlertProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  type?: AlertType;
  icon?: ReactNode;
  text?: ReactNode;
  hasHighlight?: boolean;
  css?: SerializedStyles;
};

const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  const {
    css: cssProp,
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
      css={[styles.root, cssProp]}
      {...rest}
    >
      {hasHighlight && <div css={styles.highlight} aria-hidden="true" />}
      <Flex gap={8} style={{ alignItems: 'flex-start' }}>
        {icon && (
          <span css={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span css={styles.text}>{text}</span>
      </Flex>
    </div>
  );
});

Alert.displayName = 'Alert';

export default Alert;

const styles = {
  root: scoped({
    width: '100%',
    padding: `${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing['3xl']}`,
    borderRadius: `${theme.radius.sm} ${theme.radius.xl} ${theme.radius.xl} ${theme.radius.sm}`,
    backgroundColor: theme.colors.background.fillSecondary,
    position: 'relative',
    overflow: 'hidden',
  }),
  highlight: scoped({
    backgroundColor: theme.colors.background.fillBrand,
    height: '100%',
    width: '4px',
    position: 'absolute',
    left: 0,
    top: 0,
  }),
  text: scoped({
    maxWidth: '85%',
  }),
  icon: scoped({
    flexShrink: 0,
  }),
};
