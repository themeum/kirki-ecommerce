import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import MultiSelect from '@/components/ui/multi-select';
import { type AttributeValueOption, getAttributeValueType } from '@/features/products/components/attribute-value-types';
import VariationDialog from '@/features/products/components/product-form/sections/variants/variation-dialog';
import type { AttributeValue } from '@/features/products/schemas/catalog/attribute';
import type {
  ProductAttributeFormInput,
  ProductAttributeValueInput,
} from '@/features/products/schemas/forms/product-attribute-form';
import type { ProductVariationPopoverFormPayload } from '@/features/products/schemas/forms/product-variation-popover-form';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type AttributeValuesFieldProps = {
  existingValues: AttributeValue[];
  type?: string | null;
  placeholder?: string;
};

const normalize = (name: string) => name.trim().toLowerCase();

const optionIdOf = (item: Pick<ProductAttributeValueInput, 'id' | 'value'>) =>
  item.id ?? `draft:${normalize(item.value)}`;

const toOption = (item: ProductAttributeValueInput): AttributeValueOption => ({
  value: optionIdOf(item),
  title: item.value,
  color: item.color,
});

/**
 * Multi-select for the values of the attribute a variation card is editing.
 * Everything it adds is a draft held in the card's form — nothing is written
 * to the server until the card is applied. Per-type presentation, inline
 * colour resolution and the "Add new value" dialog's fields come from the
 * attribute value type registry.
 *
 * @param props Component props.
 *
 * @returns AttributeValuesField element.
 * @since 1.0.0
 */
const AttributeValuesField = ({ existingValues, type, placeholder }: AttributeValuesFieldProps) => {
  const { control, clearErrors } = useFormContext<ProductAttributeFormInput>();
  const { field, fieldState } = useController({ control, name: 'values' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');

  const valueType = getAttributeValueType(type);
  const selected = useMemo(() => field.value ?? [], [field.value]);

  const existingById = useMemo(
    () => new Map(existingValues.map((item) => [item.id, item])),
    [existingValues],
  );

  const options = useMemo<AttributeValueOption[]>(
    () => [
      ...existingValues.map((item) => ({ value: item.id, title: item.value, color: item.color })),
      ...selected.filter((item) => item.id === undefined).map(toOption),
    ],
    [existingValues, selected],
  );

  const writeValues = (next: ProductAttributeValueInput[]) => {
    field.onChange(next);
    clearErrors('values');
  };

  const handleChange = (next: AttributeValueOption[]) => {
    const selectedById = new Map(selected.map((item) => [optionIdOf(item), item]));

    writeValues(
      next.map((option) => {
        const current = selectedById.get(option.value);

        if (current) {
          return current;
        }

        const existing = existingById.get(Number(option.value));

        return {
          id: existing?.id,
          value: option.title,
          color: existing?.color ?? option.color ?? null,
          original_color: existing?.color ?? null,
        };
      }),
    );
  };

  const addDraft = (name: string, color: string | null) => {
    const needle = normalize(name);

    if (!needle || selected.some((item) => normalize(item.value) === needle)) {
      return;
    }

    const existing = existingValues.find((item) => normalize(item.value) === needle);

    if (existing) {
      writeValues([
        ...selected,
        { id: existing.id, value: existing.value, color: existing.color ?? null, original_color: existing.color ?? null },
      ]);
      return;
    }

    writeValues([...selected, { value: name.trim(), color }]);
  };

  const handleCreate = (query: string) => {
    addDraft(query, valueType.resolveInlineColor?.(query) ?? null);
  };

  const handleColorChange = (option: AttributeValueOption, color: string) => {
    writeValues(selected.map((item) => (optionIdOf(item) === option.value ? { ...item, color } : item)));
  };

  const openDialog = (title: string) => {
    setDialogTitle(title);
    setIsDialogOpen(true);
  };

  const handleDialogSave = (payload: ProductVariationPopoverFormPayload) => {
    addDraft(payload.title, payload.color || null);
    setIsDialogOpen(false);
  };

  const hasExactMatch = (query: string) =>
    options.some((option) => normalize(option.title) === normalize(query));

  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <MultiSelect
        options={options}
        value={selected.map(toOption)}
        onChange={handleChange}
        onCreate={handleCreate}
        placeholder={placeholder ?? __('Add item', 'kirki-ecommerce')}
        error={fieldState.invalid}
        listCss={styles.list}
        renderOption={valueType.renderOption}
        renderChip={(option) => valueType.renderChip(option, (color) => handleColorChange(option, color))}
        footer={({ query, create }) => (
          <Button
            variant="tertiary"
            cssOverride={styles.footerButton}
            onClick={() => (query && !hasExactMatch(query) ? create() : openDialog(query))}
          >
            <Plus size={16} aria-hidden="true" />
            {query && !hasExactMatch(query)
              ? sprintf(__('Add "%s"', 'kirki-ecommerce'), query)
              : __('Add new value', 'kirki-ecommerce')}
          </Button>
        )}
      />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      <VariationDialog
        isOpen={isDialogOpen}
        withColor={valueType.dialogFields.includes('color')}
        initialValues={{ title: dialogTitle, value: dialogTitle, color: '' }}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleDialogSave}
      />
    </Field>
  );
};

AttributeValuesField.displayName = 'AttributeValuesField';

export default AttributeValuesField;

const styles = defineStyles({
  list: {
    maxHeight: '240px',
  },
  footerButton: {
    justifyContent: 'flex-start',
    width: '100%',
    height: 'auto',
    gap: theme.spacing[2],
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.md,
    ...theme.typography.small('medium'),
  },
});
