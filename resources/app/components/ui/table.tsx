import {
  forwardRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { type SerializedStyles } from '@emotion/react';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { TableAlignment, TableType } from '@/types';

type TableEditMode = 'multiCell' | 'singleCell';

type TableProps = Omit<HTMLAttributes<HTMLTableElement>, 'css'> & {
  type?: TableType;
  scrollable?: boolean;
  editMode?: TableEditMode;
  fixed?: boolean;
  css?: SerializedStyles;
};

const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
  const {
    type = 'default',
    scrollable,
    editMode,
    fixed,
    css: cssProp,
    ...rest
  } = props;

  return (
    <table
      ref={ref}
      css={[
        styles.base,
        styles.types[type],
        scrollable && styles.scrollable,
        fixed && styles.fixed,
        editMode && styles.editModes[editMode],
        cssProp,
      ]}
      {...rest}
    />
  );
});

Table.displayName = 'Table';

type TableHeaderProps = Omit<
  HTMLAttributes<HTMLTableSectionElement>,
  'css'
> & {
  css?: SerializedStyles;
};

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <thead ref={ref} css={cssProp} {...rest} />;
  },
);

TableHeader.displayName = 'TableHeader';

type TableBodyProps = Omit<HTMLAttributes<HTMLTableSectionElement>, 'css'> & {
  css?: SerializedStyles;
};

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <tbody ref={ref} css={cssProp} {...rest} />;
  },
);

TableBody.displayName = 'TableBody';

type TableRowProps = Omit<HTMLAttributes<HTMLTableRowElement>, 'css'> & {
  active?: boolean;
  css?: SerializedStyles;
};

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  (props, ref) => {
    const { active, css: cssProp, ...rest } = props;

    return (
      <tr
        ref={ref}
        data-active={active ? 'true' : undefined}
        css={cssProp}
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
  css?: SerializedStyles;
};

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  (props, ref) => {
    const { onlyCheckbox, alignment, css: cssProp, ...rest } = props;

    return (
      <th
        ref={ref}
        data-only-checkbox={onlyCheckbox ? 'true' : undefined}
        css={[
          styles.head,
          onlyCheckbox && styles.onlyCheckbox,
          alignment && styles.headAlignments[alignment],
          cssProp,
        ]}
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
  css?: SerializedStyles;
};

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  (props, ref) => {
    const { onlyCheckbox, alignment, disabled, css: cssProp, ...rest } = props;

    return (
      <td
        ref={ref}
        data-only-checkbox={onlyCheckbox ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        css={[
          styles.cell,
          onlyCheckbox && styles.onlyCheckbox,
          alignment && styles.cellAlignments[alignment],
          cssProp,
        ]}
        {...rest}
      />
    );
  },
);

TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };

const styles = {
  base: scoped({
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
    userSelect: 'none',
    fontFamily: '"Inter"',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '18px',
    color: theme.colors.text.primary,
    boxShadow: '0px 0.5px 1px 0px #0000001a inset',
    '& thead': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      border: `1px solid ${theme.colors.border.tertiary}`,
    },
    '& th, & td': {
      padding: theme.spacing.lg,
    },
    '& tbody': {
      backgroundColor: theme.colors.background.fill,
    },
    '& tbody tr': {
      borderBottom: `1px solid ${theme.colors.border.tertiary}`,
    },
    '& tbody tr:hover, & tbody tr[data-active="true"]': {
      backgroundColor: 'hsla(240, 20%, 98%, 0.5)',
      '& .kirki-ecom-ui-action-group, & .kirki-ecom-action-group': {
        visibility: 'visible',
      },
    },
  }),
  types: {
    default: scoped({}),
    variation: scoped({
      '& th, & td': {
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      },
    }),
    wide: scoped({
      '& th, & td': {
        padding: `${theme.spacing['2xl']} ${theme.spacing.lg}`,
      },
    }),
  },
  scrollable: scoped({
    width: 'max-content',
  }),
  fixed: scoped({
    tableLayout: 'fixed',
    '& [data-only-checkbox="true"]': {
      width: '40px',
    },
  }),
  editModes: {
    multiCell: scoped({
      userSelect: 'none',
      borderCollapse: 'separate',
      borderSpacing: '0 0',
      boxSizing: 'border-box',
      '& thead': {
        backgroundColor: theme.colors.background.fill,
      },
      '& thead th': {
        border: `1px solid ${theme.colors.border.secondary}`,
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
        backgroundColor: theme.colors.background.fill,
        zIndex: 10,
        '&.kirki-ecom-sticky-cell': {
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
        boxSizing: 'border-box',
        position: 'relative',
        border: `1px solid ${theme.colors.border.secondary}`,
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
        padding: theme.spacing.xs,
        minWidth: '110px',
        overflow: 'visible',
        '&.kirki-ecom-sticky-cell': {
          position: 'sticky',
          left: 0,
          background: theme.colors.background.fill,
          zIndex: 11,
        },
        '&:hover': {
          backgroundColor: theme.colors.background.surfaceAlt,
        },
        '&:first-child': {
          paddingLeft: theme.spacing.lg,
        },
        '& .kirki-ecom-grabber': {
          position: 'absolute',
          bottom: '-7px',
          right: '-4px',
          width: '8px',
          height: '14px',
          backgroundColor: theme.colors.background.fillBrand,
          border: '0.5px solid #ffffff',
          borderRadius: '9px',
          cursor: 'crosshair',
          boxShadow: '0px 4px 6px -1px #0000001a',
          zIndex: 10,
          visibility: 'hidden',
        },
        '&.kirki-ecom-selected-cell': {
          backgroundColor: theme.colors.background.fillSecondary,
          borderLeftColor: theme.colors.background.fillBrand,
          borderRightColor: theme.colors.background.fillBrand,
          '&.kirki-ecom-selected-min': {
            borderBottomColor: theme.colors.background.fillBrand,
          },
          '&.kirki-ecom-selected-max': {
            borderTopColor: theme.colors.background.fillBrand,
          },
          '& .kirki-ecom-grabber': {
            visibility: 'visible',
            zIndex: 10,
          },
        },
        '&.kirki-ecom-fill-cell': {
          backgroundColor: theme.colors.background.surfaceAlt,
          borderLeftStyle: 'dashed',
          borderRightStyle: 'dashed',
          borderLeftColor: theme.colors.border.hover,
          borderRightColor: theme.colors.border.hover,
          '&.kirki-ecom-fill-min': {
            borderBottomStyle: 'dashed',
            borderBottomColor: theme.colors.border.hover,
          },
          '&.kirki-ecom-fill-max': {
            borderTopStyle: 'dashed',
            borderTopColor: theme.colors.border.hover,
          },
          '& .kirki-ecom-grabber': {
            visibility: 'visible',
          },
        },
        '&.kirki-ecom-base-cell': {
          border: `1px solid ${theme.colors.background.fillBrand}`,
        },
        '&[data-disabled="true"]': {
          opacity: 1,
          cursor: 'no-drop',
          pointerEvents: 'visible',
          backgroundColor: theme.colors.background.fill,
        },
      },
    }),
    singleCell: scoped({
      '& tbody tr:hover': {
        backgroundColor: 'transparent',
      },
      '& tbody td:hover': {
        backgroundColor: theme.colors.background.surfaceSecondary,
      },
    }),
  },
  head: scoped({
    textAlign: 'left',
    fontWeight: 400,
    whiteSpace: 'nowrap',
  }),
  cell: scoped({
    textAlign: 'left',
    color: theme.colors.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '& .kirki-ecom-ui-action-group, & .kirki-ecom-action-group': {
      gap: theme.spacing.md,
      display: 'inline-flex',
      visibility: 'hidden',
    },
  }),
  onlyCheckbox: scoped({
    width: '1%',
  }),
  headAlignments: {
    right: scoped({
      marginLeft: 'auto',
      marginRight: theme.spacing.none,
      textAlign: 'right',
    }),
    center: scoped({
      marginLeft: 'auto',
      marginRight: 'auto',
      textAlign: 'center',
    }),
  },
  cellAlignments: {
    right: scoped({
      marginLeft: 'auto',
      marginRight: theme.spacing.none,
      textAlign: 'right',
      '& label': {
        marginLeft: 'auto',
        marginRight: theme.spacing.none,
        textAlign: 'right',
      },
    }),
    center: scoped({
      marginLeft: 'auto',
      marginRight: 'auto',
      textAlign: 'center',
      '& label': {
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
      },
    }),
  },
};
