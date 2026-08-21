import { type CSSObject } from '@emotion/react';
import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';

import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import type { TableAlignment, TableDensity } from '@/types/components/common';

type TableProps = Omit<HTMLAttributes<HTMLTableElement>, 'css'> & {
  density?: TableDensity;
  fixed?: boolean;
  cssOverride?: CSSObject;
};

const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
  const {
    density = 'default',
    fixed,
    cssOverride,
    ...rest
  } = props;

  return (
    <div data-slot="table-container" css={scoped(styles.container)}>
      <table
        ref={ref}
        css={scopedMerge(styles.base, styles.densities[density], fixed && styles.fixed, cssOverride)}
        {...rest}
      />
    </div>
  );
});

Table.displayName = 'Table';

type TableHeaderProps = Omit<
  HTMLAttributes<HTMLTableSectionElement>,
  'css'
> & {
  cssOverride?: CSSObject;
};

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return <thead ref={ref} css={scopedMerge(cssOverride)} {...rest} />;
  },
);

TableHeader.displayName = 'TableHeader';

type TableBodyProps = Omit<HTMLAttributes<HTMLTableSectionElement>, 'css'> & {
  cssOverride?: CSSObject;
};

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return <tbody ref={ref} css={scopedMerge(cssOverride)} {...rest} />;
  },
);

TableBody.displayName = 'TableBody';

type TableFooterProps = Omit<
  HTMLAttributes<HTMLTableSectionElement>,
  'css'
> & {
  cssOverride?: CSSObject;
};

const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <tfoot ref={ref} css={scopedMerge(styles.footer, cssOverride)} {...rest} />
    );
  },
);

TableFooter.displayName = 'TableFooter';

type TableRowProps = Omit<HTMLAttributes<HTMLTableRowElement>, 'css'> & {
  active?: boolean;
  cssOverride?: CSSObject;
};

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  (props, ref) => {
    const { active, cssOverride, ...rest } = props;

    return (
      <tr
        ref={ref}
        data-active={active ? 'true' : undefined}
        css={scopedMerge(cssOverride)}
        {...rest}
      />
    );
  },
);

TableRow.displayName = 'TableRow';

type TableHeadProps = Omit<
  ThHTMLAttributes<HTMLTableCellElement>,
  'css'
> & {
  onlyCheckbox?: boolean;
  alignment?: TableAlignment;
  cssOverride?: CSSObject;
};

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  (props, ref) => {
    const { onlyCheckbox, alignment, cssOverride, ...rest } = props;

    return (
      <th
        ref={ref}
        data-only-checkbox={onlyCheckbox ? 'true' : undefined}
        css={scopedMerge(styles.head, onlyCheckbox && styles.onlyCheckbox, alignment && styles.headAlignments[alignment], cssOverride)}
        {...rest}
      />
    );
  },
);

TableHead.displayName = 'TableHead';

type TableCellProps = Omit<
  TdHTMLAttributes<HTMLTableCellElement>,
  'css'
> & {
  onlyCheckbox?: boolean;
  alignment?: TableAlignment;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  (props, ref) => {
    const { onlyCheckbox, alignment, disabled, cssOverride, ...rest } = props;

    return (
      <td
        ref={ref}
        data-only-checkbox={onlyCheckbox ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        css={scopedMerge(styles.cell, onlyCheckbox && styles.onlyCheckbox, alignment && styles.cellAlignments[alignment], cssOverride)}
        {...rest}
      />
    );
  },
);

TableCell.displayName = 'TableCell';

type TableCaptionProps = Omit<
  HTMLAttributes<HTMLTableCaptionElement>,
  'css'
> & {
  cssOverride?: CSSObject;
};

const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <caption ref={ref} css={scopedMerge(styles.caption, cssOverride)} {...rest} />
    );
  },
);

TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
};

const styles = defineStyles({
  container: {
    width: '100%',
    overflowX: 'auto',
  },
  base: {
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
    userSelect: 'none',
    ...theme.typography.tiny(),
    color: theme.colors.text.primary,
    boxShadow: theme.shadow.sm,
    '& thead': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      border: `1px solid ${theme.colors.border.tertiary}`,
    },
    '& th, & td': {
      padding: theme.spacing[3],
    },
    '& tbody': {
      backgroundColor: theme.colors.background.fill,
    },
    '& tbody tr': {
      borderBottom: `1px solid ${theme.colors.border.tertiary}`,
    },
    '& tbody tr:hover, & tbody tr[data-active="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      '& [data-action-group="true"]': {
        visibility: 'visible',
      },
    },
  },
  densities: {
    default: {},
    compact: {
      '& th, & td': {
        padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      },
    },
    wide: {
      '& th, & td': {
        padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
      },
    },
  },
  fixed: {
    tableLayout: 'fixed',
    '& [data-only-checkbox="true"]': {
      width: '40px',
    },
  },
  footer: {
    borderTop: `1px solid ${theme.colors.border.tertiary}`,
    backgroundColor: theme.colors.background.surfaceAlt,
    ...theme.typography.tiny('medium'),
  },
  head: {
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  cell: {
    textAlign: 'left',
    color: theme.colors.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& [data-action-group="true"]': {
      gap: theme.spacing[2],
      display: 'inline-flex',
      visibility: 'hidden',
    },
  },
  caption: {
    marginTop: theme.spacing[4],
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  },
  onlyCheckbox: {
    width: '1%',
  },
  headAlignments: {
    right: {
      marginLeft: 'auto',
      marginRight: theme.spacing[0],
      textAlign: 'right',
    },
    center: {
      marginLeft: 'auto',
      marginRight: 'auto',
      textAlign: 'center',
    },
  },
  cellAlignments: {
    right: {
      marginLeft: 'auto',
      marginRight: theme.spacing[0],
      textAlign: 'right',
      '& label': {
        marginLeft: 'auto',
        marginRight: theme.spacing[0],
        textAlign: 'right',
      },
    },
    center: {
      marginLeft: 'auto',
      marginRight: 'auto',
      textAlign: 'center',
      '& label': {
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
      },
    },
  },
});
