import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CLASS_PREFIX } from '@/conf';
import { ColorPaletteIcon, ListIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import ActionGroup from '@/molecules/action-group';
import Flex from '@/molecules/flex';
import Searchbox from '@/components/ui/searchbox';
import { useProductForm } from '@/contexts/product-form-context';
import {
  ProductAttributeFormSchema,
  type ProductAttributeFormValues,
  type ProductAttributeValueFormValues,
} from '@/schemas/forms/product-attribute-form';
import {
  useAttributesQuery,
  useCreateAttributeMutation,
} from '@/services/attribute';
import type {
  Attribute,
  AttributeFormData,
  SelectOption,
} from '@/types';
import { __ } from '@/wpi18n';

import AddOrEditVariation from '@/pages/products/edit-product/variants/attribute-list/add-or-edit-variation';

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
  const { onClose = () => {}, data, onSave = () => {} } = props;

  const { product: productData, updateProduct, updateProductAttributes } =
    useProductForm();
  const { attributes: productAttributes } = productData;
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

    const result = (await onSave()) as SaveResult | undefined;

    if (result?.success) {
      updateProductAttributes(attributeList);
      updateProduct({ key: 'has_variants', value: true });
      handleOnClose();
    }
  };

  const handleAttributeSelect = (v: SelectOption) => {
    form.setValue('name', v.title, { shouldDirty: true });
    form.setValue('id', v.value as number, { shouldDirty: true });
    form.setValue('type', type, { shouldDirty: true });
    form.setValue('values', [], { shouldDirty: true });
    form.clearErrors(['id', 'name']);
  };

  const handleAttributeSearchChange = (v: string) => {
    form.setValue('name', v, { shouldDirty: true });
    form.setValue('type', type, { shouldDirty: true });
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

  const handleClearAttributeName = () => {
    const isListed = attributeSuggestionArray.some(
      (item) => item.value === formData?.id,
    );
    if (!isListed) {
      const clearedData: AttributeSuggestion = {
        value: formData?.id as number,
        title: formData?.name || '',
        type: type as string,
      };
      setAttributeSuggestionArray((prev) => [...prev, clearedData]);
    }
    form.reset({
      id: undefined,
      name: '',
      slug: undefined,
      type,
      values: [],
    });
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
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}>
        <CardContent>
          <Flex direction="column" gap={16}>
            {!data && (
              <Flex direction="column" gap={8}>
                <div>{__('Show in Product page as', 'kirki-ecommerce')}</div>
                <Flex
                  style={{
                    border: '1px solid #eeedf3',
                    borderRadius: '8px',
                    width: 'max-content',
                  }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    style={{
                      borderColor: type === 'list' ? '#5641f3' : 'transparent',
                    }}
                    onClick={() => handleOnTypeChange('list')}
                  >
                    <ListIcon />
                    {__('List', 'kirki-ecommerce')}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    style={{
                      borderColor:
                        type === 'color' ? '#5641f3' : 'transparent',
                    }}
                    onClick={() => handleOnTypeChange('color')}
                  >
                    <ColorPaletteIcon />
                    {__('Color', 'kirki-ecommerce')}
                  </Button>
                </Flex>
              </Flex>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    {__('Variation Name', 'kirki-ecommerce')}
                  </FormLabel>
                  <FormControl>
                    <Searchbox
                      error={Boolean(
                        fieldState.error ||
                          form.formState.errors.id ||
                          form.formState.errors.name,
                      )}
                      value={field.value || ''}
                      placeholder={__(
                        'e.g. Size or Material',
                        'kirki-ecommerce',
                      )}
                      onChange={(value) =>
                        handleAttributeSearchChange(String(value))
                      }
                      hasIcon={false}
                      suggestionArray={attributeSuggestionArray}
                      onOptionClick={(value) => handleAttributeSelect(value)}
                      onEnter={(value) => handleNewAttributeAdd(String(value))}
                      onNewOptionAdd={(value) =>
                        handleNewAttributeAdd(String(value))
                      }
                      hasAddBtn
                      btnText="Add Attribute"
                      onClearInput={
                        field.value ? handleClearAttributeName : undefined
                      }
                      readOnly={!!formData?.id}
                      state={formData?.id ? 'disabled' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
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

export type {
  ProductAttributeFormValues as AttributeFormState,
  ProductAttributeValueFormValues as AttributeFormValue,
};
