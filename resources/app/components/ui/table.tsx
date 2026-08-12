import { type CSSObject } from '@emotion/react';
import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
import type { TableAlignment, TableType } from '@/types/components/common';

type TableEditMode = 'multiCell' | 'singleCell';

type TableProps = Omit<HTMLAttributes<HTMLTableElement>, 'css'> & {
  type?: TableType;
  scrollable?: boolean;
  editMode?: TableEditMode;
  fixed?: boolean;
  cssOverride?: CSSObject;
};

const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
  const {
    type = 'default',
    scrollable,
    editMode,
    fixed,
    cssOverride,
    ...rest
  } = props;

  return (
    <table
      ref={ref}
      css={scopedMerge(styles.base, styles.types[type], scrollable && styles.scrollable, fixed && styles.fixed, editMode && styles.editModes[editMode], cssOverride)}
      {...rest}
    />
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

    return <thead ref={ref} css={cssOverride} {...rest} />;
  },
);

TableHeader.displayName = 'TableHeader';

type TableBodyProps = Omit<HTMLAttributes<HTMLTableSectionElement>, 'css'> & {
  cssOverride?: CSSObject;
};

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return <tbody ref={ref} css={cssOverride} {...rest} />;
  },
);

TableBody.displayName = 'TableBody';

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
        css={cssOverride}
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

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };

const styles = defineStyles({
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
  types: {
    default: {},
    variation: {
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
  scrollable: {
    width: 'max-content',
  },
  fixed: {
    tableLayout: 'fixed',
    '& [data-only-checkbox="true"]': {
      width: '40px',
    },
  },
  editModes: {
    multiCell: {
      userSelect: 'none',
      borderCollapse: 'separate',
      borderSpacing: '0 0',
      '& thead': {
        backgroundColor: theme.colors.background.fill,
      },
      '& thead th': {
        border: `1px solid ${theme.colors.border.secondary}`,
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
        backgroundColor: theme.colors.background.fill,
        zIndex: 10,
        '&[data-sticky-cell="true"]': {
          position: 'sticky',
          left: 0,
          zIndex: 11,
          borderTopColor: theme.colors.border.secondary,
        },
      },
      '& tbody tr:hover': {
        backgroundColor: theme.colors.background.fill,
      },
      '& td': {
        position: 'relative',
        border: `1px solid ${theme.colors.border.secondary}`,
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
        padding: theme.spacing[1],
        minWidth: '110px',
        overflow: 'visible',
        '&[data-sticky-cell="true"]': {
          position: 'sticky',
          left: 0,
          background: theme.colors.background.fill,
          zIndex: 11,
        },
        '&:hover': {
          backgroundColor: theme.colors.background.surfaceAlt,
        },
        '&:first-of-type': {
          paddingLeft: theme.spacing[3],
        },
        '& [data-grabber="true"]': {
          position: 'absolute',
          bottom: '-7px',
          right: '-4px',
          width: '8px',
          height: '14px',
          backgroundColor: theme.colors.background.fillBrand,
          border: `0.5px solid ${theme.colors.background.surface}`,
          borderRadius: theme.radius.lg,
          cursor: 'crosshair',
          boxShadow: theme.shadow.md,
          zIndex: 10,
          visibility: 'hidden',
        },
        '&[data-bulk-cell="selected"]': {
          backgroundColor: theme.colors.background.fillSecondary,
          borderLeftColor: theme.colors.background.fillBrand,
          borderRightColor: theme.colors.background.fillBrand,
          '&[data-bulk-edge="min"]': {
            borderBottomColor: theme.colors.background.fillBrand,
          },
          '&[data-bulk-edge="max"]': {
            borderTopColor: theme.colors.background.fillBrand,
          },
          '& [data-grabber="true"]': {
            visibility: 'visible',
            zIndex: 10,
          },
        },
        '&[data-bulk-cell="fill"]': {
          backgroundColor: theme.colors.background.surfaceAlt,
          borderLeftStyle: 'dashed',
          borderRightStyle: 'dashed',
          borderLeftColor: theme.colors.border.hover,
          borderRightColor: theme.colors.border.hover,
          '&[data-bulk-edge="min"]': {
            borderBottomStyle: 'dashed',
            borderBottomColor: theme.colors.border.hover,
          },
          '&[data-bulk-edge="max"]': {
            borderTopStyle: 'dashed',
            borderTopColor: theme.colors.border.hover,
          },
          '& [data-grabber="true"]': {
            visibility: 'visible',
          },
        },
        '&[data-bulk-edge="base"]': {
          border: `1px solid ${theme.colors.background.fillBrand}`,
        },
        '&[data-disabled="true"]': {
          opacity: 1,
          cursor: 'no-drop',
          pointerEvents: 'visible',
          backgroundColor: theme.colors.background.fill,
        },
      },
    },
    singleCell: {
      '& tbody tr:hover': {
        backgroundColor: 'transparent',
      },
      '& tbody td:hover': {
        backgroundColor: theme.colors.background.surfaceSecondary,
      },
    },
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
