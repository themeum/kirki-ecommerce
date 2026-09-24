import type { ReactNode } from 'react';

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from '@/components/ui/color-picker';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { getHexFromColorName } from '@/utils/color';
import { __, sprintf } from '@/wpi18n';

/**
 * Option shape handed to MultiSelect for a product attribute's values.
 * `value` is the attribute value id (or a draft key for a value not saved
 * yet), `title` its label.
 */
type AttributeValueOption = {
  value: string | number;
  title: string;
  color?: string | null;
};

type AttributeValueDialogField = 'title' | 'color';

type AttributeValueTypeConfig = {
  /** Renders an option inside the popover list. */
  renderOption: (option: AttributeValueOption) => ReactNode;
  /**
   * Renders a value inside its chip. `onColorChange` is only passed while the
   * card is being edited; without it the chip is read-only.
   */
  renderChip: (option: AttributeValueOption, onColorChange?: (color: string) => void) => ReactNode;
  /**
   * Resolves the colour for a value created straight from typed text. Types
   * without colours leave it out.
   */
  resolveInlineColor?: (query: string) => string | null;
  /** Fields the "Add new value" dialog asks for. */
  dialogFields: AttributeValueDialogField[];
};

const withSwatch = (option: AttributeValueOption) => (
  <>
    <ColorPicker value={option.color ?? ''} disabled>
      <ColorPickerSwatch />
    </ColorPicker>
    {option.title}
  </>
);

const withEditableSwatch = (option: AttributeValueOption, onColorChange?: (color: string) => void) => {
  if (!onColorChange) {
    return withSwatch(option);
  }

  return (
    <>
      <ColorPicker value={option.color ?? ''} onValueChange={(next) => next && onColorChange(next)}>
        <ColorPickerTrigger
          aria-label={sprintf(__('Change the colour of %s', 'kirki-ecommerce'), option.title)}
          cssOverride={styles.swatchTrigger}
        >
          <ColorPickerSwatch />
        </ColorPickerTrigger>
        <ColorPickerContent>
          <ColorPickerArea />
          <ColorPickerInput placeholder={__('#000000', 'kirki-ecommerce')} />
        </ColorPickerContent>
      </ColorPicker>
      {option.title}
    </>
  );
};

/**
 * Per-attribute-type presentation and creation behaviour. A new attribute
 * type is added here rather than inside AttributeValuesField, which stays
 * type-agnostic and just looks the entry up.
 */
const attributeValueTypes: Record<string, AttributeValueTypeConfig> = {
  list: {
    renderOption: (option) => option.title,
    renderChip: (option) => option.title,
    dialogFields: ['title'],
  },
  color: {
    renderOption: withSwatch,
    renderChip: withEditableSwatch,
    resolveInlineColor: (query) => getHexFromColorName(query) || null,
    dialogFields: ['title', 'color'],
  },
};

/**
 * Resolves an attribute type to its config, falling back to `list` for
 * unknown or absent types.
 *
 * @param type Attribute type slug.
 *
 * @returns Config for that type.
 * @since 1.0.0
 */
const getAttributeValueType = (type?: string | null): AttributeValueTypeConfig =>
  attributeValueTypes[type ?? ''] ?? attributeValueTypes.list;

export { attributeValueTypes, getAttributeValueType };
export type { AttributeValueDialogField, AttributeValueOption, AttributeValueTypeConfig };

const styles = defineStyles({
  swatchTrigger: {
    width: 'auto',
    minHeight: 0,
    padding: 0,
    border: 'none',
    borderRadius: theme.radius.full,
    backgroundColor: 'transparent',
  },
});
