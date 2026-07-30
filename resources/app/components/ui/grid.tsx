import type { CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { buildGridAreas, buildGridTemplate, resolveGap } from '@/components/ui/layout-utils';
import { scopedMerge, defineStyles } from '@/theme/mixins';
import type { FlexAlign, FlexJustify, GapValue } from '@/types';

type GridProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  columns?: number;
  template?: string | string[];
  areas?: string[][];
  align?: FlexAlign;
  justify?: FlexJustify;
  gap?: GapValue;
  rowGap?: GapValue;
  columnGap?: GapValue;
  cssOverride?: CSSObject;
};

const Grid = forwardRef<HTMLDivElement, GridProps>((props, ref) => {
  const {
    cssOverride,
    columns = 2,
    template,
    areas,
    align,
    justify,
    gap = 3,
    rowGap,
    columnGap,
    children,
    ...rest
  } = props;

  const gridTemplateColumns = buildGridTemplate(columns, template);

  const layout: CSSObject = {
    ...(gridTemplateColumns !== undefined ? { gridTemplateColumns } : {}),
    ...(areas !== undefined
      ? { gridTemplateAreas: buildGridAreas(areas) }
      : {}),
    ...(align !== undefined ? { alignItems: align } : {}),
    ...(justify !== undefined ? { justifyContent: justify } : {}),
    ...(gap !== undefined ? { gap: resolveGap(gap) } : {}),
    ...(rowGap !== undefined ? { rowGap: resolveGap(rowGap) } : {}),
    ...(columnGap !== undefined ? { columnGap: resolveGap(columnGap) } : {}),
  };

  return (
    <div
      ref={ref}
      css={scopedMerge(styles.root, layout, cssOverride)}
      {...rest}
    >
      {children}
    </div>
  );
});

Grid.displayName = 'Grid';

export default Grid;

const styles = defineStyles({
  root: {
    display: 'grid',
  },
});
