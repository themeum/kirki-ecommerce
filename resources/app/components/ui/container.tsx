import type { SerializedStyles } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { ContainerSize } from '@/types';

type ContainerProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  size?: ContainerSize;
  scrollable?: boolean;
  css?: SerializedStyles;
};

const Container = forwardRef<HTMLDivElement, ContainerProps>((props, ref) => {
  const { css: cssProp, size, scrollable, children, ...rest } = props;

  return (
    <div
      ref={ref}
      css={[
        styles.root,
        size && styles.sizes[size],
        scrollable && styles.scrollable,
        cssProp,
      ]}
      {...rest}
    >
      {children}
    </div>
  );
});

Container.displayName = 'Container';

export default Container;

const styles = {
  root: scoped({
    maxWidth: '1024px',
    margin: `${theme.spacing.none} auto`,
  }),
  sizes: {
    sm: scoped({
      maxWidth: '600px',
    }),
    md: scoped({
      maxWidth: '752px',
    }),
    lg: scoped({
      maxWidth: '1024px',
    }),
    fullWidth: scoped({
      maxWidth: '100%',
    }),
  },
  scrollable: scoped({
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
  }),
};
