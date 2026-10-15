import { useEffect, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Field, FieldError } from '@/components/ui/field';
import Input from '@/components/ui/input';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import {
  attributeNameClashMessage,
  classifyAttributeName,
  type ProductAttributeFormInput,
} from '@/features/products/schemas/forms/product-attribute-form';
import { __ } from '@/wpi18n';

type AttributeNameInputProps = {
  attributes: Attribute[];
  appliedIds?: number[];
  focusOnMount?: boolean;
  onReuse?: (attribute: Attribute) => void;
};

/**
 * The attribute's name input. On blur it checks the name against every other
 * attribute in the store. With no values selected, a match is handed to
 * `onReuse`; otherwise the clash is flagged before Apply is reached.
 *
 * @param props Component props.
 *
 * @returns AttributeNameInput element.
 * @since 1.0.0
 */
const AttributeNameInput = ({
  attributes,
  appliedIds = [],
  focusOnMount = false,
  onReuse,
}: AttributeNameInputProps) => {
  const { control, getValues, setError, clearErrors } = useFormContext<ProductAttributeFormInput>();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusOnMount) {
      inputRef.current?.focus();
    }
  }, [focusOnMount]);

  const handleBlur = (name: string) => {
    const match = classifyAttributeName({
      name,
      attributes,
      sourceAttributeId: getValues('source_attribute_id'),
      appliedIds,
      selectedCount: getValues('values')?.length ?? 0,
    });

    if (match.kind === 'reuse') {
      clearErrors('name');
      onReuse?.(match.attribute);
      return;
    }

    if (match.kind === 'none') {
      clearErrors('name');
      return;
    }

    setError('name', { type: 'duplicate', message: attributeNameClashMessage(match.kind) });
  };

  return (
    <Controller
      control={control}
      name="name"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <Input
            ref={(node) => {
              inputRef.current = node;
              field.ref(node);
            }}
            value={field.value ?? ''}
            aria-label={__('Variation name', 'kirki-ecommerce')}
            placeholder={__('e.g. Size or Material', 'kirki-ecommerce')}
            error={fieldState.invalid}
            onChange={(event) => {
              field.onChange(event.target.value);

              if (fieldState.error?.type === 'duplicate') {
                clearErrors('name');
              }
            }}
            onBlur={(event) => {
              field.onBlur();
              handleBlur(event.target.value);
            }}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

AttributeNameInput.displayName = 'AttributeNameInput';

export default AttributeNameInput;
