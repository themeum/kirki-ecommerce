import { Check } from 'lucide-react';

import {
  RIBBON_COLOR_PALETTE,
  type RibbonColor,
} from '@/features/products/schemas/forms/product-basics-form';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scopedMerge } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type RibbonColorSwatchesProps = {
  value: RibbonColor;
  onChange: (color: RibbonColor) => void;
};

/**
 * One control per palette colour. The palette is fixed application data,
 * not a styling choice, so only the chrome around each swatch (size,
 * border, focus ring, spacing) comes from `theme`.
 */
const RibbonColorSwatches = ({ value, onChange }: RibbonColorSwatchesProps) => (
  <div
    role="radiogroup"
    aria-label={__('Ribbon colour', 'kirki-ecommerce')}
    css={scopedMerge(styles.row)}
  >
    {RIBBON_COLOR_PALETTE.map((color) => {
      const isSelected = color === value;

      return (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={isSelected}
          aria-label={sprintf(__('Ribbon colour %s', 'kirki-ecommerce'), color)}
          onClick={() => onChange(color)}
          style={{ ['--swatch-color' as string]: color }}
          css={scopedMerge(styles.swatch, isSelected && styles.swatchSelected)}
        >
          {isSelected && <Check size={14} aria-hidden="true" css={scopedMerge(styles.check)} />}
        </button>
      );
    })}
  </div>
);

RibbonColorSwatches.displayName = 'RibbonColorSwatches';

type RibbonPreviewBadgeProps = {
  text: string;
  color: string;
};

/**
 * Reads the same watched form values the inputs write, so it updates as the
 * merchant types with no separate state to keep in sync.
 */
const RibbonPreviewBadge = ({ text, color }: RibbonPreviewBadgeProps) => (
  <span style={{ ['--ribbon-preview-color' as string]: color }} css={scopedMerge(styles.preview)}>
    {text ?? __('Preview', 'kirki-ecommerce')}
  </span>
);

RibbonPreviewBadge.displayName = 'RibbonPreviewBadge';

export { RibbonColorSwatches, RibbonPreviewBadge };
export type { RibbonColorSwatchesProps, RibbonPreviewBadgeProps };

const styles = defineStyles({
  row: {
    ...itemCenter(),
    gap: theme.spacing[2],
  },
  swatch: {
    ...itemCenter(),
    justifyContent: 'center',
    flexShrink: 0,
    width: '24px',
    height: '24px',
    padding: 0,
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border.default}`,
    backgroundColor: 'var(--swatch-color)',
    cursor: 'pointer',
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${theme.colors.background.surface}, 0 0 0 4px ${theme.colors.border.ring}`,
    },
  },
  swatchSelected: {
    boxShadow: `0 0 0 2px ${theme.colors.background.surface}, 0 0 0 4px ${theme.colors.border.ring}`,
  },
  check: {
    color: theme.colors.text.light,
    filter: 'drop-shadow(0 0 1px rgb(0 0 0 / 0.4))',
  },
  preview: {
    ...itemCenter(),
    alignSelf: 'flex-start',
    ...theme.typography.tiny('medium'),
    color: theme.colors.text.light,
    backgroundColor: 'var(--ribbon-preview-color)',
    padding: `${theme.spacing[1]} ${theme.spacing[4]}`,
    borderRadius: theme.radius.sm,
  },
});
