import { type CSSObject } from '@emotion/react';

import { theme } from '@/theme';

const bulkEditTableStyles: CSSObject = {
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
};

export { bulkEditTableStyles };
