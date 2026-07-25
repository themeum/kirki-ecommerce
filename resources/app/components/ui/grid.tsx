import type { SerializedStyles } from '@emotion/react';
import { css } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import {
  buildGridAreas,
  buildGridTemplate,
  resolveGap,
} from '@/components/ui/layout-utils';
import { scoped } from '@/theme/mixins';
import type { FlexAlign, FlexJustify, GapValue } from '@/types';

type GridCssProp =
  | SerializedStyles
  | Array<SerializedStyles | false | null | undefined>;

type GridProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  columns?: number;
  template?: string | string[];
  areas?: string[][];
  align?: FlexAlign;
  justify?: FlexJustify;
  gap?: GapValue;
  rowGap?: GapValue;
  columnGap?: GapValue;
  css?: GridCssProp;
};

const Grid = forwardRef<HTMLDivElement, GridProps>((props, ref) => {
  const {
    css: cssProp,
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

  return (
    <div
      ref={ref}
      css={[
        styles.root,
        gridTemplateColumns !== undefined &&
          css({ gridTemplateColumns }),
        areas !== undefined && css({ gridTemplateAreas: buildGridAreas(areas) }),
        align !== undefined && css({ alignItems: align }),
        justify !== undefined && css({ justifyContent: justify }),
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

Grid.displayName = 'Grid';

export default Grid;

const styles = {
  root: scoped({
    display: 'grid',
  }),
};
