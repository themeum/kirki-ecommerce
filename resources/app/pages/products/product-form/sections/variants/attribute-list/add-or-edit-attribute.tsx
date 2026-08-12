import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useFormContext, useWatch } from 'react-hook-form';

import AttributeValuesField from '@/components/form/attribute-values-field';
import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
import Combobox from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import { ColorPaletteIcon, ListIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import {
  type MatrixMutation,
  savedVariants,
  useVariantMatrix,
} from '@/pages/products/product-form/sections/variants/use-variant-matrix';
import type { AddVariationFormPayload } from '@/schemas/forms/add-variation-form';
import {
  type ProductAttributeFormInput,
  ProductAttributeFormSchema,
} from '@/schemas/forms/product-attribute-form';
import type { ProductFormInput } from '@/schemas/forms/product-form';
import { useAttributesQuery, useCreateAttributeMutation } from '@/services/attribute';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type {
  Attribute,
  SelectOption,
} from '@/types';
import { noop } from '@/utils/function';
import { __, _n, sprintf } from '@/wpi18n';

type AttributeSuggestion = SelectOption & {
  type?: string;
};

type AddOrEditAttributeProps = {
  onClose?: () => void;
  data?: Attribute;
};

const AddOrEditAttribute = (props: AddOrEditAttributeProps) => {
  const { onClose = noop, data } = props;

  const { control } = useFormContext<ProductFormInput>();
  const watchedProductAttributes = useWatch({ control, name: 'attributes' });
  const productAttributes = useMemo(
    () => (watchedProductAttributes ?? []) as Attribute[],
    [watchedProductAttributes],
  );
  const { addAttribute, updateAttribute, describeDiscarded } = useVariantMatrix();
  const [pendingApply, setPendingApply] = useState<MatrixMutation | null>(null);
  const { data: allAttributesList, isSuccess: loaded } = useAttributesQuery({
    limit: -1,
  });
  const createAttributeMutation = useCreateAttributeMutation();

  const form = useForm<ProductAttributeFormInput>({
    resolver: zodResolver(ProductAttributeFormSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name,
      slug: data?.slug,
      type: data?.values?.[0]?.color ? 'color' : 'list',
      values: data?.values ?? [],
    },
  });

  const type = form.watch('type') ?? 'list';
  const formData = form.watch();
  const [attributeSuggestionArray, setAttributeSuggestionArray] = useState<
    AttributeSuggestion[]
  >([]);

  const generateAttributeSuggestionArray = useCallback(() => {
    const allAttributes = (allAttributesList ?? [])
      .map((item) => ({
        value: item?.id,
        title: item?.name,
        type: item?.type,
      }))
      .filter(
        (attr) =>
          attr.type === type &&
          !productAttributes.some((val) => val.id === attr.value),
      );
    setAttributeSuggestionArray(allAttributes);
  }, [allAttributesList, type, productAttributes]);

  useEffect(() => {
    if (loaded) {
      generateAttributeSuggestionArray();
    }
  }, [loaded, generateAttributeSuggestionArray]);

  useEffect(() => {
    if (loaded && data) {
      const selectedValues = (data.values ?? []).map((item) => ({
        ...item,
        title: item?.value,
        value: item?.id,
      }));
      form.reset({
        id: data.id,
        name: data.name,
        slug: data.slug,
        type: data.values?.[0]?.color ? 'color' : 'list',
        values: selectedValues,
      });
    }
  }, [loaded, data, form]);

  const handleApply = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const payload = ProductAttributeFormSchema.parse(
      form.getValues(),
    ) as Attribute;

    const mutation = data?.id
      ? updateAttribute(payload)
      : addAttribute(payload);

    if (savedVariants(mutation.discarded).length > 0) {
      setPendingApply(mutation);
      return;
    }

    mutation.commit();
    handleOnClose();
  };

  const handleConfirmApply = () => {
    pendingApply?.commit();
    setPendingApply(null);
    handleOnClose();
  };

  const handleAttributeSelect = (attributeValue: string) => {
    const selected = attributeSuggestionArray.find(
      (item) => String(item.value) === attributeValue,
    );
    if (!selected) {
      return;
    }

    form.setValue('name', selected.title, { shouldDirty: true });
    form.setValue('id', selected.value as number, { shouldDirty: true });
    form.setValue('type', type, { shouldDirty: true });
    form.setValue('values', [], { shouldDirty: true });
    form.clearErrors(['id', 'name']);
  };

  const handleNewAttributeAdd = async (value: string) => {
    const newAttribute: AddVariationFormPayload = {
      name: value,
      type,
    };
    try {
      const response = await createAttributeMutation.mutateAsync(newAttribute);
      const attributeData = response.data as Attribute & { slug?: string };
      const { id, name, slug, type: attrType, values } = attributeData;
      form.reset({
        id,
        name,
        slug,
        type: attrType,
        values: (values) ?? [],
      });
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleOnClose = () => {
    form.reset({
      id: undefined,
      name: '',
      slug: undefined,
      type: null,
      values: [],
    });
    setAttributeSuggestionArray([]);
    onClose();
  };

  const handleOnTypeChange = (nextType: string) => {
    form.reset({
      id: undefined,
      name: '',
      slug: undefined,
      type: nextType,
      values: [],
    });
    form.clearErrors(['id', 'name', 'values']);
  };

  return (
    <Form {...form}>
      <Card cssOverride={cardStyles.innerCard}>
        <CardContent cssOverride={cardStyles.innerCardContent}>
          <Flex direction="column" gap={4}>
            {!data && (
              <Flex direction="column" gap={2}>
                <Text variant="small" weight="medium">{__('Show in Product Page as', 'kirki-ecommerce')}</Text>
                <ButtonGroup>
                  <Button
                    variant="outline"
                    size="lg"
                    cssOverride={type === 'list' ? styles.typeSelected : undefined}
                    onClick={() => handleOnTypeChange('list')}
                  >
                    <ListIcon />
                    {__('List', 'kirki-ecommerce')}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    cssOverride={type === 'color' ? styles.typeSelected : undefined}
                    onClick={() => handleOnTypeChange('color')}
                  >
                    <ColorPaletteIcon />
                    {__('Color', 'kirki-ecommerce')}
                  </Button>
                </ButtonGroup>
              </Flex>
            )}
            <Controller
              control={form.control}
              name="name"
              render={({ fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>
                    {__('Variation Name', 'kirki-ecommerce')}
                  </FieldLabel>
                  <Combobox
                    error={Boolean(
                      fieldState.error ??
                      form.formState.errors.id ??
                      form.formState.errors.name,
                    )}
                    value={
                      formData?.id != null ? String(formData.id) : undefined
                    }
                    options={[
                      ...(formData?.id != null && formData?.name
                        ? [
                          {
                            label: formData.name,
                            value: String(formData.id),
                          },
                        ]
                        : []),
                      ...attributeSuggestionArray
                        .filter(
                          (item) => String(item.value) !== String(formData?.id),
                        )
                        .map((item) => ({
                          label: item.title,
                          value: String(item.value),
                        })),
                    ]}
                    placeholder={__(
                      'e.g. Size or Material',
                      'kirki-ecommerce',
                    )}
                    searchPlaceholder={__(
                      'e.g. Size or Material',
                      'kirki-ecommerce',
                    )}
                    creatable
                    addItemLabel={__('Add Attribute', 'kirki-ecommerce')}
                    onChange={(nextValue) =>
                      handleAttributeSelect(String(nextValue))
                    }
                    onAddItem={(query) => handleNewAttributeAdd(query)}
                    disabled={!!formData?.id}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <AttributeValuesField
              name="values"
              label={__('Variation Values', 'kirki-ecommerce')}
              attributeId={formData?.id}
              type={type}
              disabled={!formData?.id}
              placeholder={__('Add', 'kirki-ecommerce')}
              addItemLabel={__('Add Variation', 'kirki-ecommerce')}
            />

            <ActionGroup>
              <Button variant="secondary" onClick={handleOnClose}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                disabled={
                  !(
                    formData?.id &&
                    formData?.values &&
                    formData.values.length > 0
                  )
                }
                onClick={handleApply}
              >
                {__('Apply', 'kirki-ecommerce')}
              </Button>
            </ActionGroup>
          </Flex>
        </CardContent>
      </Card>
      {!!pendingApply && (
        <ConfirmationDialog
          variant="delete"
          title={__('Remove variations?', 'kirki-ecommerce')}
          subtitle={sprintf(
            _n(
              '%1$d saved variation will be deleted when you save this product: %2$s',
              '%1$d saved variations will be deleted when you save this product: %2$s',
              savedVariants(pendingApply.discarded).length,
              'kirki-ecommerce',
            ),
            savedVariants(pendingApply.discarded).length,
            describeDiscarded(savedVariants(pendingApply.discarded)),
          )}
          onConfirm={handleConfirmApply}
          onCancel={() => setPendingApply(null)}
        />
      )}
    </Form>
  );
};

AddOrEditAttribute.displayName = 'AddOrEditAttribute';

export default AddOrEditAttribute;

const styles = defineStyles({
  typeSelected: {
    position: 'relative',
    zIndex: 2,
    borderColor: theme.colors.background.fillBrand,
  },
});

