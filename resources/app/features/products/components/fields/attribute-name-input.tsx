import { useEffect, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Field, FieldError } from '@/components/ui/field';
import Input from '@/components/ui/input';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import {
  duplicateAttributeNameMessage,
  findAttributeNameClash,
  type ProductAttributeFormInput,
} from '@/features/products/schemas/forms/product-attribute-form';
import { __ } from '@/wpi18n';

type AttributeNameInputProps = {
  attributes: Pick<Attribute, 'id' | 'name'>[];
  focusOnMount?: boolean;
};

/**
 * The attribute's name input. On blur it checks the name against every other
 * attribute in the store, so a clash is flagged before Apply is reached.
 *
 * @param props Component props.
 *
 * @returns AttributeNameInput element.
 * @since 1.0.0
 */
const AttributeNameInput = ({ attributes, focusOnMount = false }: AttributeNameInputProps) => {
  const { control, getValues, setError, clearErrors } = useFormContext<ProductAttributeFormInput>();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusOnMount) {
      inputRef.current?.focus();
    }
  }, [focusOnMount]);

  const handleBlur = (name: string) => {
    if (findAttributeNameClash(name, attributes, getValues('source_attribute_id'))) {
      setError('name', { type: 'duplicate', message: duplicateAttributeNameMessage() });
      return;
    }

    clearErrors('name');
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
