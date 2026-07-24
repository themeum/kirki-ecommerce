import { type SerializedStyles } from '@emotion/react';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { flexCenter, scoped } from '@/theme/mixins';
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
    ...theme.typography.paragraph(),
  }),
  icon: scoped({
    ...flexCenter(),
  }),
  subheading: scoped({
    color: theme.colors.text.secondary,
  }),
  subheadingTypes: {
    primary: scoped({
      ...theme.typography.paragraph(),
      color: theme.colors.text.secondary,
    }),
    secondary: scoped({
      ...theme.typography.small(),
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
      ...theme.typography.paragraph('semibold'),
      rowGap: theme.spacing[2],
    }),
    secondary: scoped({
      rowGap: theme.spacing[2],
      ...theme.typography.paragraph('medium'),
    }),
    disabled: scoped({
      color: theme.colors.text.disabled,
    }),
    xsm: scoped({
      ...theme.typography.small(),
    }),
    tertiary: scoped({}),
    inner: scoped({}),
  },
  emphasis: scoped({
    color: theme.colors.text.emphasis,
  }),
  padding: {
    large: scoped({
      padding: `${theme.spacing[2]} ${theme.spacing[0]}`,
    }),
    small: scoped({
      padding: `${theme.spacing[1]} ${theme.spacing[0]}`,
    }),
  },
};
