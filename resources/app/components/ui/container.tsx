import type { CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { theme } from '@/theme';
import { scopedMerge } from '@/theme/mixins';
import type { ContainerSize } from '@/types';

type ContainerProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  size?: ContainerSize;
  scrollable?: boolean;
  cssOverride?: CSSObject;
};

const Container = forwardRef<HTMLDivElement, ContainerProps>((props, ref) => {
  const { cssOverride, size, scrollable, children, ...rest } = props;

  return (
    <div
      ref={ref}
      css={scopedMerge(
        styles.root,
        size && styles.sizes[size],
        scrollable && styles.scrollable,
        cssOverride,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

Container.displayName = 'Container';

export default Container;

const styles = {
  root: ({
    maxWidth: '1024px',
    margin: `${theme.spacing[0]} auto`,
    padding: `${theme.spacing[0]} ${theme.spacing[2]}`,
  } satisfies CSSObject),
  sizes: {
    sm: ({
      maxWidth: '600px',
    } satisfies CSSObject),
    md: ({
      maxWidth: '752px',
    } satisfies CSSObject),
    lg: ({
      maxWidth: '900px',
    } satisfies CSSObject),
    xl: ({
      maxWidth: '1024px',
    } satisfies CSSObject),
    fullWidth: ({
      maxWidth: '100%',
    } satisfies CSSObject),
  },
  scrollable: ({
    overflow: 'scroll',
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.colors.background.fillBrand} ${theme.colors.background.surfaceTertiary}`,
    '&::-webkit-scrollbar': {
      height: '4px',
      width: '100%',
      WebkitAppearance: 'none',
    },
    '&::-webkit-scrollbar-track': {
      background: theme.colors.background.fill,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.colors.background.fillBrand,
      borderRadius: theme.radius.sm,
      border: 0,
      minWidth: '100px !important',
      width: '40px !important',
      maxWidth: '40px !important',
    },
  } satisfies CSSObject),
};
