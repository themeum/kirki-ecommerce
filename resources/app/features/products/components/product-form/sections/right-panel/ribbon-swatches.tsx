import { Check, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerInput,
  ColorPickerTrigger,
} from '@/components/ui/color-picker';
import { RIBBON_COLOR_PALETTE } from '@/features/products/schemas/forms/product-basics-form';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scopedMerge } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type RibbonColorSwatchesProps = {
  value: string;
  onChange: (color: string) => void;
};

/**
 * One control per default swatch, plus a trailing custom-colour picker so a
 * merchant is not limited to the five defaults. The defaults are fixed
 * application data, not a styling choice, so only the chrome around each
 * swatch (size, border, focus ring, spacing) comes from `theme`.
 */
const RibbonColorSwatches = ({ value, onChange }: RibbonColorSwatchesProps) => {
  const isCustom = value !== '' && !(RIBBON_COLOR_PALETTE as readonly string[]).includes(value);
  const [customColor, setCustomColor] = useState(isCustom ? value : '');

  useEffect(() => {
    if (isCustom) {
      setCustomColor(value);
    }
  }, [isCustom, value]);

  const hasCustomColor = customColor !== '';
  const customSwatchColor = isCustom ? value : customColor;

  return (
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

      <ColorPicker value={customSwatchColor} onValueChange={(next) => next && onChange(next)}>
        <ColorPickerTrigger
          role="radio"
          aria-checked={isCustom}
          aria-label={
            isCustom
              ? sprintf(__('Custom ribbon colour %s, editable', 'kirki-ecommerce'), value)
              : hasCustomColor
                ? sprintf(__('Custom ribbon colour %s, editable', 'kirki-ecommerce'), customColor)
                : __('Add a custom ribbon colour', 'kirki-ecommerce')
          }
          onClick={() => {
            if (!isCustom && hasCustomColor) {
              onChange(customColor);
            }
          }}
          style={hasCustomColor ? { ['--swatch-color' as string]: customSwatchColor } : undefined}
          cssOverride={
            hasCustomColor
              ? {
                  ...styles.swatch,
                  ...(isCustom && styles.swatchSelected),
                  backgroundColor: 'var(--swatch-color)',
                }
              : { ...styles.swatch, ...styles.swatchCustom }
          }
        >
          {hasCustomColor ? (
            <Pencil size={12} aria-hidden="true" css={scopedMerge(styles.editIcon)} />
          ) : (
            <Plus size={14} aria-hidden="true" css={scopedMerge(styles.plus)} />
          )}
        </ColorPickerTrigger>
        <ColorPickerContent>
          <ColorPickerArea />
          <ColorPickerInput placeholder={__('#000000', 'kirki-ecommerce')} />
        </ColorPickerContent>
      </ColorPicker>
    </div>
  );
};

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
    {text ? text.toUpperCase() : __('Preview', 'kirki-ecommerce')}
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
    minHeight: 'auto',
    padding: 0,
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border.default}`,
    backgroundColor: 'var(--swatch-color)',
    cursor: 'pointer',
    textAlign: 'center',
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${theme.colors.background.surface}, 0 0 0 4px ${theme.colors.border.ring}`,
    },
  },
  swatchSelected: {
    boxShadow: `0 0 0 2px ${theme.colors.background.surface}, 0 0 0 4px ${theme.colors.border.ring}`,
  },
  swatchCustom: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: theme.colors.border.hover,
  },
  check: {
    color: theme.colors.text.light,
    filter: 'drop-shadow(0 0 1px rgb(0 0 0 / 0.4))',
  },
  editIcon: {
    color: theme.colors.text.light,
    filter: 'drop-shadow(0 0 1px rgb(0 0 0 / 0.4))',
  },
  plus: {
    color: theme.colors.text.secondary,
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
