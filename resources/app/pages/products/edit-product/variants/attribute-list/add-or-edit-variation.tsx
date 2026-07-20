import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PlusIcon } from '@/icons';
import { getErrorsObject, type ErrorResponse } from '@/libs/api';
import { TagManager } from '@/molecules/tag-manager';
import { getSearchedValue } from '@/pages/settings/utils';
import type {
  ProductAttributeFormValues,
  ProductAttributeValueFormValues,
} from '@/schemas/forms/product-attribute-form';
import {
  useAttributesQuery,
  useCreateAttributeValueMutation,
} from '@/services/attribute';
import type {
  Attribute,
  AttributeValue,
  AttributeValueFormData,
  SelectOption,
} from '@/types';
import { __ } from '@/wpi18n';

import VariationPopover from '@/pages/products/edit-product/variants/variation-popover';

const AddOrEditVariation = () => {
  const { control, setValue, watch, clearErrors, setError } =
    useFormContext<ProductAttributeFormValues>();
  const type = watch('type');
  const formId = watch('id');
  const formValues = watch('values') || [];

  const { data: allAttributesList, isSuccess: loaded } = useAttributesQuery({
    limit: -1,
  });
  const createAttributeValueMutation = useCreateAttributeValueMutation();
  const [addNewVariationPopup, setAddNewVariationPopup] = useState(false);
  const [variationSuggestionArray, setVariationSuggestionArray] = useState<
    SelectOption[]
  >([]);
  const [searchedText, setSearchedText] = useState('');

  useEffect(() => {
    if (loaded) {
      setSearchedText('');
      generateVariationSuggestionArray();
    }
  }, [loaded, formId]);

  const generateVariationSuggestionArray = (
    searchText = searchedText,
    attrId = formId,
    selectedValues = formValues,
  ) => {
    if (!attrId) {
      setVariationSuggestionArray([]);
      return;
    }

    const currentAttributeData = (
      allAttributesList as Attribute[] | null
    )?.find((item) => item?.id === attrId);

    let valuesList: AttributeValue[] | undefined = currentAttributeData?.values;
    if (searchText) {
      valuesList = getSearchedValue(searchText, valuesList) as AttributeValue[];
    }

    const variationArray = valuesList
      ?.map((item) => ({
        value: item?.id,
        color: item?.color ?? undefined,
        title: item?.value,
      }))
      .filter(
        (data) =>
          !selectedValues?.some(
            (v) => v.id === data?.value || v?.value === data?.value,
          ),
      );

    setVariationSuggestionArray(variationArray || []);
  };

  const handleVariationAdd = (v: SelectOption) => {
    const newValue: ProductAttributeValueFormValues = {
      value: v.value,
      color: v.color as string | null | undefined,
      title: v.title,
    };

    setSearchedText('');
    generateVariationSuggestionArray('', formId, [...formValues, newValue]);

    setValue('values', [...formValues, newValue], {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (type) {
      setValue('type', type, { shouldDirty: true });
    }
    clearErrors('values');
  };

  const handleNewVariationAdd = async (
    v: string | { title?: string; color?: string; value?: string },
  ) => {
    let newValue: AttributeValueFormData;
    if (type === 'color') {
      const colorValue = v as { title?: string; color?: string };
      newValue = {
        attribute_id: formId as number,
        value: colorValue.title,
        color: colorValue.color,
      };
    } else {
      newValue = {
        attribute_id: formId as number,
        value: v as string,
        color: undefined,
      };
    }
    try {
      const response = await createAttributeValueMutation.mutateAsync(newValue);
      const resultData = response.data as AttributeValue;
      const { value, id, color } = resultData;
      const addedValue: ProductAttributeValueFormValues = {
        value: id,
        title: value,
        color: color,
      };
      setValue('values', [addedValue, ...formValues], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      const fieldErrors = getErrorsObject((error as ErrorResponse).errors);
      if (fieldErrors.value) {
        setError('values', { message: String(fieldErrors.value) });
      }
    }
  };

  const handleVariationRemove = (v: SelectOption) => {
    const newList = formValues.filter((item) => item?.value !== v?.value);
    setValue('values', newList, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (type) {
      setValue('type', type, { shouldDirty: true });
    }
    if (v.value) {
      setSearchedText('');
      generateVariationSuggestionArray('', formId, newList);
    }
    clearErrors('values');
  };

  const handleSearchChange = (searchText: string) => {
    const keyword = searchText?.trim();
    setSearchedText(keyword);
    generateVariationSuggestionArray(searchText);
    clearErrors('values');
  };

  return (
    <>
      <FormField
        control={control}
        name="values"
        render={({ fieldState }) => (
          <FormItem>
            <FormLabel>
              {__('Variation Values', 'kirki-ecommerce')}
            </FormLabel>
            <FormControl>
              <TagManager
                error={Boolean(fieldState.error)}
                placeholder={__('Add', 'kirki-ecommerce')}
                suggestions={variationSuggestionArray}
                selectedTags={formValues as SelectOption[]}
                value={searchedText}
                searchKey={formValues as unknown as string}
                onTagAdd={(value) => handleVariationAdd(value)}
                btnText="Add Variation"
                onSearchChange={(searchValue) => handleSearchChange(searchValue)}
                onNewTagAdd={(value) =>
                  type === 'color'
                    ? setAddNewVariationPopup(true)
                    : handleNewVariationAdd(value)
                }
                onTagRemove={(value) => handleVariationRemove(value)}
                leftIcon={<PlusIcon />}
                type="list"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <VariationPopover
        isOpen={addNewVariationPopup}
        onClose={() => setAddNewVariationPopup(false)}
        onSave={(v) => handleNewVariationAdd(v)}
      />
    </>
  );
};

AddOrEditVariation.displayName = 'AddOrEditVariation';

export default AddOrEditVariation;
