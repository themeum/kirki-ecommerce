import type { SerializedStyles } from '@emotion/react';
import { css } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { resolveGap } from '@/components/ui/layout-utils';
import { scoped } from '@/theme/mixins';
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

type FlexCssProp =
  | SerializedStyles
  | Array<SerializedStyles | false | null | undefined>;

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
  css?: FlexCssProp;
};

const Flex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  const {
    css: cssProp,
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

  return (
    <div
      ref={ref}
      css={[
        styles.root,
        direction === 'column' && styles.column,
        direction === 'row' && styles.row,
        align !== undefined && css({ alignItems: align }),
        justify !== undefined && css({ justifyContent: justify }),
        wrap !== undefined && css({ flexWrap: wrap }),
        grow !== undefined && css({ flexGrow: grow }),
        shrink !== undefined && css({ flexShrink: shrink }),
        basis !== undefined && css({ flexBasis: basis }),
        gap !== undefined && css({ gap: resolveGap(gap) }),
        rowGap !== undefined && css({ rowGap: resolveGap(rowGap) }),
        columnGap !== undefined && css({ columnGap: resolveGap(columnGap) }),
        cssProp,
      ]}
      {...rest}
    >
      {children}
    </div>
  );
});

Flex.displayName = 'Flex';

export default Flex;

const styles = {
  root: scoped({
    display: 'flex',
  }),
  column: scoped({
    flexDirection: 'column',
  }),
  row: scoped({
    flexDirection: 'row',
  }),
};
