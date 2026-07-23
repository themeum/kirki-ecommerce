import { type SerializedStyles, type Theme } from '@emotion/react';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { flexCenter, fontGeneralSettings, scoped } from '@/theme/mixins';
import type { TextType } from '@/types';

type TextProps = {
  type?: TextType;
  header?: ReactNode;
  subHeader?: ReactNode;
  style?: CSSProperties;
  padding?: 'large' | 'small';
  emphasis?: boolean;
  leftIcon?: ReactNode;
  gap?: number;
  badge?: ReactNode;
  css?: SerializedStyles;
};

const Text = forwardRef<HTMLDivElement, TextProps>((props, ref) => {
  const {
    css: cssProp,
    type,
    header,
    subHeader,
    style = {},
    padding,
    emphasis,
    leftIcon,
    gap = 8,
    badge,
  } = props;

  return (
    <Flex ref={ref} gap={gap} style={{ alignItems: 'center' }}>
      {leftIcon && (
        <span css={styles.icon} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <div
        css={[
          styles.text,
          type && styles.textTypes[type],
          padding && styles.padding[padding],
          emphasis && styles.emphasis,
          cssProp,
        ]}
        style={style}
      >
        {header && (
          <Flex gap={8}>
            <span css={type && styles.subheadingTypes[type]}>{header}</span>
            {badge && <span>{badge}</span>}
          </Flex>
        )}
        {subHeader && (
          <span css={[styles.subheading, type && styles.subheadingTypes[type]]}>
            {subHeader}
          </span>
        )}
      </div>
    </Flex>
  );
});

Text.displayName = 'Text';

export default Text;

const styles = {
  text: scoped({
    display: 'flex',
    flexDirection: 'column',
    ...fontGeneralSettings(theme as Theme),
  }),
  icon: scoped({
    ...flexCenter(),
  }),
  subheading: scoped({
    color: theme.colors.text.secondary,
  }),
  subheadingTypes: {
    primary: scoped({
      ...fontGeneralSettings(theme as Theme),
      color: theme.colors.text.secondary,
    }),
    secondary: scoped({
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: 400,
      color: theme.colors.text.secondary,
    }),
    disabled: scoped({
      color: theme.colors.text.disabled,
    }),
    xsm: scoped({
      color: theme.colors.text.subdued,
    }),
    tertiary: scoped({}),
    inner: scoped({}),
  },
  textTypes: {
    primary: scoped({
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: '20px',
      rowGap: theme.spacing.md,
    }),
    secondary: scoped({
      rowGap: theme.spacing.sm,
      ...fontGeneralSettings(theme as Theme),
      fontWeight: 500,
    }),
    disabled: scoped({
      color: theme.colors.text.disabled,
    }),
    xsm: scoped({
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: '12px',
      lineHeight: '18px',
      letterSpacing: '0%',
    }),
    tertiary: scoped({}),
    inner: scoped({}),
  },
  emphasis: scoped({
    color: theme.colors.text.emphasis,
  }),
  padding: {
    large: scoped({
      padding: `${theme.spacing.md} ${theme.spacing.none}`,
    }),
    small: scoped({
      padding: `${theme.spacing.xs} ${theme.spacing.none}`,
    }),
  },
};
