import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm, useFormContext } from 'react-hook-form';

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
import { ProductAttributeFormSchema, type ProductAttributeFormValues, type ProductAttributeValueFormValues } from '@/schemas/forms/product-attribute-form';
import type { ProductFormValues } from '@/schemas/forms/product-form';
import { useAttributesQuery, useCreateAttributeMutation } from '@/services/attribute';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type {
  Attribute,
  AttributeFormData,
  SelectOption,
} from '@/types';
import { __ } from '@/wpi18n';

import AddOrEditVariation from '@/pages/products/product-form/sections/variants/attribute-list/add-or-edit-variation';
import { createVariantCombinations } from '@/pages/products/utils';

type SaveResult = {
  success?: boolean;
};

type AttributeSuggestion = SelectOption & {
  type?: string;
};

type AddOrEditAttributeProps = {
  onClose?: () => void;
  data?: Attribute;
  onSave?: () => Promise<SaveResult | false | void> | SaveResult | false | void;
};

const AddOrEditAttribute = (props: AddOrEditAttributeProps) => {
  const { onClose = () => { }, data, onSave = () => { } } = props;

  const { getValues, setValue } = useFormContext<ProductFormValues>();
  const productAttributes = (getValues('attributes') ?? []) as Attribute[];
  const { data: allAttributesList, isSuccess: loaded } = useAttributesQuery({
    limit: -1,
  });
  const createAttributeMutation = useCreateAttributeMutation();

  const form = useForm<ProductAttributeFormValues>({
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

  useEffect(() => {
    if (loaded) {
      generateAttributeSuggestionArray();
    }
  }, [allAttributesList, type, loaded]);

  useEffect(() => {
    if (loaded && data) {
      const selectedValues = (data.values ?? []).map((item) => ({
        ...item,
        title: item?.value as string,
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

  const generateAttributeSuggestionArray = () => {
    const allAttributes = (allAttributesList || [])
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
  };

  const handleSaveAttribute = async () => {
    const values = form.getValues();
    const formattedValues = (values.values || []).map((item) => ({
      id: item?.value as number,
      value: item?.title as string,
      color: item?.color ?? undefined,
    }));

    let attributeList = productAttributes;
    if (data?.id) {
      attributeList = productAttributes.map((item) =>
        item.id === data?.id
          ? ({
            id: values.id,
            name: values.name,
            values: formattedValues,
          } as Attribute)
          : item,
      );
    } else {
      attributeList = [
        ...attributeList,
        {
          id: values.id,
          name: values.name,
          values: formattedValues,
        } as Attribute,
      ];
    }

    const currentVariants = getValues('variants') ?? [];
    const nextVariants = createVariantCombinations(
      attributeList,
      currentVariants as never,
    );
    setValue('attributes', attributeList, { shouldDirty: true });
    setValue('variants', nextVariants as never, { shouldDirty: true });
    setValue('has_variants', true, { shouldDirty: true });

    const result = (await onSave()) as SaveResult | undefined;

    if (result?.success) {
      handleOnClose();
    }
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
    const newAttribute: AttributeFormData = {
      name: value,
      type: type as string,
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
        values: (values as ProductAttributeValueFormValues[]) ?? [],
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
        <CardContent cssOverride={cardStyles.innerContent}>
          <Flex direction="column" gap={4}>
            {!data && (
              <Flex direction="column" gap={2}>
                <Text variant="small" weight="medium">{__('Show in Product page as', 'kirki-ecommerce')}</Text>
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
                      fieldState.error ||
                      form.formState.errors.id ||
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
            <AddOrEditVariation />

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
                onClick={handleSaveAttribute}
              >
                {__('Apply', 'kirki-ecommerce')}
              </Button>
            </ActionGroup>
          </Flex>
        </CardContent>
      </Card>
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

export type {
  ProductAttributeFormValues as AttributeFormState,
  ProductAttributeValueFormValues as AttributeFormValue
};

