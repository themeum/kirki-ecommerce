import type { CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { resolveGap } from '@/components/ui/layout-utils';
import { scopedMerge, defineStyles } from '@/theme/mixins';
import type {
  FlexAlign,
  FlexBasis,
  FlexDirection,
  FlexGrow,
  FlexJustify,
  FlexShrink,
  FlexWrap,
  GapValue,
} from '@/types';

type FlexProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: FlexWrap;
  grow?: FlexGrow;
  shrink?: FlexShrink;
  basis?: FlexBasis;
  gap?: GapValue;
  rowGap?: GapValue;
  columnGap?: GapValue;
  cssOverride?: CSSObject;
};

const Flex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  const {
    cssOverride,
    direction,
    align,
    justify,
    wrap,
    grow,
    shrink,
    basis,
    gap,
    rowGap,
    columnGap,
    children,
    ...rest
  } = props;

  const layout: CSSObject = {
    ...(align !== undefined ? { alignItems: align } : {}),
    ...(justify !== undefined ? { justifyContent: justify } : {}),
    ...(wrap !== undefined ? { flexWrap: wrap } : {}),
    ...(grow !== undefined ? { flexGrow: grow } : {}),
    ...(shrink !== undefined ? { flexShrink: shrink } : {}),
    ...(basis !== undefined ? { flexBasis: basis } : {}),
    ...(gap !== undefined ? { gap: resolveGap(gap) } : {}),
    ...(rowGap !== undefined ? { rowGap: resolveGap(rowGap) } : {}),
    ...(columnGap !== undefined ? { columnGap: resolveGap(columnGap) } : {}),
  };

  return (
    <div
      ref={ref}
      css={scopedMerge(
        styles.root,
        direction === 'column' && styles.column,
        direction === 'row' && styles.row,
        layout,
        cssOverride,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

Flex.displayName = 'Flex';

export default Flex;

const styles = defineStyles({
  root: {
    display: 'flex',
  },
  column: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
});
