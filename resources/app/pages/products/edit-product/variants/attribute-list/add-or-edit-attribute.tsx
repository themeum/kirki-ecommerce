import { useEffect, useState } from 'react';

import { ColorPaletteIcon, ListIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { useProductForm } from '@/contexts/product-form-context';
import { useAttributesQuery, useCreateAttributeMutation } from '@/services/attribute';
import { getErrorsObject } from '@/libs/api';
import type {
  Attribute,
  AttributeFormData,
  FormErrors,
  SelectOption,
} from '@/types';
import { __ } from '@/wpi18n';

import AddOrEditVariation from '@/pages/products/edit-product/variants/attribute-list/add-or-edit-variation';

type SaveResult = {
  success?: boolean;
};

type AttributeFormValue = {
  id?: number;
  value?: number | string;
  title?: string;
  color?: string | null;
};

type AttributeFormState = {
  id?: number;
  name?: string;
  slug?: string;
  type?: string;
  values?: AttributeFormValue[];
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

  const { product: productData, updateProduct, updateProductAttributes } = useProductForm();
  const { attributes: productAttributes } = productData;
  const { data: allAttributesList, isSuccess: loaded } = useAttributesQuery({ limit: -1 });
  const createAttributeMutation = useCreateAttributeMutation();

  const [formData, setFormData] = useState<AttributeFormState | undefined>(
    data,
  );
  const [type, setType] = useState<string | null>(
    data?.values?.[0]?.color ? 'color' : 'list',
  );
  const [attributeSuggestionArray, setAttributeSuggestionArray] = useState<
    AttributeSuggestion[]
  >([]);
  const [variationErrors, setVariationErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (loaded) {
      generateAttributeSuggestionArray();
    }
  }, [allAttributesList, type]);

  useEffect(() => {
    if (loaded && data) {
      const selectedvalues = formData?.values?.map((item) => ({
        ...item,
        title: item?.value as string,
        value: item?.id,
      }));
      setFormData({ ...formData, values: selectedvalues });
    }
  }, [loaded, data]);

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
    const formattedValues = (formData?.values || []).map((item) => ({
      id: item?.value as number,
      value: item?.title as string,
      color: item?.color ?? undefined,
    }));

    let attribuleList = productAttributes;
    if (data?.id) {
      attribuleList = productAttributes.map((item) =>
        item.id === data?.id
          ? ({
              id: formData?.id,
              name: formData?.name,
              values: formattedValues,
            } as Attribute)
          : item,
      );
    } else {
      attribuleList = [
        ...attribuleList,
        {
          id: formData?.id,
          name: formData?.name,
          values: formattedValues,
        } as Attribute,
      ];
    }

    const result = (await onSave()) as SaveResult | undefined;

    if (result?.success) {
      updateProductAttributes(attribuleList);
      updateProduct({ key: 'has_variants', value: true });
      handleOnClose();
    }
  };

  const handleAttributeSelect = (v: SelectOption) => {
    const { title, value } = v;
    setFormData({
      name: title,
      id: value as number,
      type: type as string,
      values: [],
    });
    setVariationErrors((prev) => ({
      ...prev,
      attribute_id: null,
      name: null,
    }));
  };

  const handleAttributeSearchChange = (v: string) => {
    setFormData((prev) => ({
      ...prev,
      name: v,
      type: type as string,
    }));
    setVariationErrors((prev) => ({
      ...prev,
      attribute_id: null,
      name: null,
    }));
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
      setFormData({
        id,
        name,
        slug,
        type: attrType,
        values: values as AttributeFormValue[],
      });
    } catch (error) {
      setVariationErrors(
        getErrorsObject((error as { errors?: Record<string, string[]> }).errors),
      );
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
    setFormData({});
  };

  const handleOnClose = () => {
    setFormData({});
    setType(null);
    setAttributeSuggestionArray([]);
    onClose();
  };

  const handleOnTypeChange = (nextType: string) => {
    setType(nextType);
    setFormData({});
    setVariationErrors((prev) => ({
      ...prev,
      attribute_id: null,
      name: null,
      value: null,
    }));
  };

  return (
    <>
      <Card type="inner">
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
                  type="outlined"
                  text={__('List', 'kirki-ecommerce')}
                  leftIcon={<ListIcon />}
                  size="large"
                  style={{
                    borderColor: type === 'list' ? '#5641f3' : 'transparent',
                  }}
                  onClick={() => handleOnTypeChange('list')}
                />
                <Button
                  type="outlined"
                  text={__('Color', 'kirki-ecommerce')}
                  leftIcon={<ColorPaletteIcon />}
                  size="large"
                  style={{
                    borderColor: type === 'color' ? '#5641f3' : 'transparent',
                  }}
                  onClick={() => handleOnTypeChange('color')}
                />
              </Flex>
            </Flex>
          )}
          <Searchbox
            error={
              (variationErrors?.name ||
                variationErrors?.attribute_id) as string | boolean | undefined
            }
            value={formData?.name || ''}
            label={__('Variation Name', 'kirki-ecommerce')}
            placeholder={__('e.g. Size or Material', 'kirki-ecommerce')}
            onChange={(value) => handleAttributeSearchChange(String(value))}
            hasIcon={false}
            suggestionArray={attributeSuggestionArray}
            onOptionClick={(value) => handleAttributeSelect(value)}
            onEnter={(value) => handleNewAttributeAdd(String(value))}
            onNewOptionAdd={(value) => handleNewAttributeAdd(String(value))}
            hasAddBtn
            btnText="Add Attribute"
            onClearInput={
              formData?.name ? handleClearAttributeName : undefined
            }
            readOnly={!!formData?.id}
            state={formData?.id ? 'disabled' : ''}
          />
          <AddOrEditVariation
            type={type}
            variationErrors={variationErrors}
            setVariationErrors={setVariationErrors}
            formData={formData}
            setFormData={setFormData}
          />

          <ActionGroup>
            <Button
              type="secondary"
              text={__('Cancel', 'kirki-ecommerce')}
              onClick={handleOnClose}
            />
            <Button
              type="primary"
              text={__('Apply', 'kirki-ecommerce')}
              state={
                formData?.id && formData?.values && formData.values.length > 0
                  ? ''
                  : 'disabled'
              }
              onClick={handleSaveAttribute}
            />
          </ActionGroup>
        </Flex>
      </Card>
    </>
  );
};

AddOrEditAttribute.displayName = 'AddOrEditAttribute';

export default AddOrEditAttribute;

export type { AttributeFormState, AttributeFormValue };
