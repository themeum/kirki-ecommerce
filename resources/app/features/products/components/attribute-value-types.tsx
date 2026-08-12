import type { ReactNode } from 'react';

import ColorSwatch from '@/components/ui/color-swatch';

/**
 * Option shape handed to MultiSelect for a product attribute's values.
 * `value` is the attribute value id, `title` its label.
 */
type AttributeValueOption = {
  value: string | number;
  title: string;
  color?: string | null;
};

type AttributeValueTypeConfig = {
  /** Renders an option inside the popover list. */
  renderOption: (option: AttributeValueOption) => ReactNode;
  /** Renders a selected option inside its chip. */
  renderChip: (option: AttributeValueOption) => ReactNode;
  /**
   * `inline` creates the value straight from the typed text. `dialog` needs
   * more input first, so the field opens its editor instead.
   */
  createVia: 'inline' | 'dialog';
};

const withSwatch = (option: AttributeValueOption) => (
  <>
    <ColorSwatch color={option.color} />
    {option.title}
  </>
);

/**
 * Per-attribute-type presentation and creation behaviour. A new attribute
 * type is added here rather than inside AttributeValuesField, which stays
 * type-agnostic and just looks the entry up.
 */
const attributeValueTypes: Record<string, AttributeValueTypeConfig> = {
  list: {
    renderOption: (option) => option.title,
    renderChip: (option) => option.title,
    createVia: 'inline',
  },
  color: {
    renderOption: withSwatch,
    renderChip: withSwatch,
    createVia: 'dialog',
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
export type { AttributeValueOption, AttributeValueTypeConfig };
