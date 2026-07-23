import { type SerializedStyles, type Theme } from '@emotion/react';
import {
  InfoCircledIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons';
import * as LabelPrimitive from '@radix-ui/react-label';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import Tooltip from '@/components/ui/tooltip';
import { theme } from '@/theme';
import { flexCenter, fontGeneralSettings, itemCenter, scoped } from '@/theme/mixins';

type LabelProps = Omit<
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
  'children' | 'className' | 'css'
> & {
  children?: ReactNode;
  text?: ReactNode;
  type?: 'error' | 'disabled' | '';
  helpText?: ReactNode;
  infoText?: ReactNode;
  error?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  css?: SerializedStyles;
};

const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const {
    css: cssProp,
    children,
    text,
    type,
    helpText,
    infoText,
    error,
    leftIcon,
    rightIcon,
    ...rest
  } = props;
  const content = children ?? text;
  const isError = error || type === 'error';
  const isDisabled = type === 'disabled';

  const iconColor = isError ? theme.colors.icon.critical : 'currentColor';

  return (
    <LabelPrimitive.Root
      ref={ref}
      css={[
        styles.root,
        isError && styles.error,
        isDisabled && styles.disabled,
        cssProp,
      ]}
      {...rest}
    >
      {leftIcon && <span css={styles.icon}>{leftIcon}</span>}
      {content}
      {helpText && (
        <Tooltip type="dark" tip={helpText}>
          <span css={styles.icon}>
            <QuestionMarkCircledIcon
              width={16}
              height={16}
              color={iconColor}
            />
          </span>
        </Tooltip>
      )}
      {infoText && (
        <Tooltip type="dark" tip={infoText}>
          <span css={styles.icon}>
            <InfoCircledIcon width={16} height={16} color={iconColor} />
          </span>
        </Tooltip>
      )}
      {rightIcon && <span css={styles.icon}>{rightIcon}</span>}
    </LabelPrimitive.Root>
  );
});

Label.displayName = 'Label';

export default Label;

const styles = {
  root: scoped({
    ...fontGeneralSettings(theme as Theme),
    fontWeight: 500,
    color: theme.colors.text.primary,
    ...itemCenter(),
    gap: theme.spacing.xs,
    cursor: 'default',
  }),
  error: scoped({
    color: theme.colors.text.critical,
  }),
  disabled: scoped({
    opacity: 0.5,
  }),
  icon: scoped({
    ...flexCenter(),
    display: 'inline-flex',
  }),
};
