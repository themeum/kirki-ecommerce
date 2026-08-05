import type { CSSObject } from '@emotion/react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { ComponentRef, forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';

type SeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
  'className' | 'css'
> & {
  marginTop?: string | number;
  marginBottom?: string | number;
  color?: string;
  height?: string | number;
  cssOverride?: CSSObject;
};

const toCssLength = (value: string | number) => {
  return typeof value === 'number' ? `${value}px` : value;
};

const Separator = forwardRef<
  ComponentRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>((props, ref) => {
  const {
    cssOverride,
    orientation = 'horizontal',
    decorative = true,
    marginTop,
    marginBottom,
    color,
    height,
    style,
    ...rest
  } = props;

  const separatorStyle = defineStyles({
    ...(marginTop !== undefined
      ? { '--separator-margin-top': toCssLength(marginTop) }
      : {}),
    ...(marginBottom !== undefined
      ? { '--separator-margin-bottom': toCssLength(marginBottom) }
      : {}),
    ...(color !== undefined ? { '--separator-color': color } : {}),
    ...(height !== undefined
      ? { '--separator-size': toCssLength(height) }
      : {}),
    ...style,
  }) as CSSProperties;

  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      style={separatorStyle}
      css={scopedMerge(
        styles.root,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        cssOverride,
      )}
      {...rest}
    />
  );
});

Separator.displayName = 'Separator';

export { Separator };

const styles = defineStyles({
  root: {
    flexShrink: 0,
    backgroundColor: `var(--separator-color, ${theme.colors.border.default})`,
    border: 'none',
    marginTop: 'var(--separator-margin-top, 0)',
    marginBottom: 'var(--separator-margin-bottom, 0)',
  },
  horizontal: {
    height: 'var(--separator-size, 1px)',
    width: '100%',
  },
  vertical: {
    height: '100%',
    width: 'var(--separator-size, 1px)',
  },
});
