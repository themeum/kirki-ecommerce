import React, { useEffect, useState } from 'react';

import { PlusIcon } from '@/icons';
import { TagManager } from '@/molecules/tag-manager';
import { getSearchedValue } from '@/pages/settings/utils';
import {
  addAttributeValueAPI,
  setKeyValue,
} from '@/store/attributesSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import type {
  Attribute,
  AttributeValue,
  AttributeValueFormData,
  FormErrors,
  SelectOption,
} from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import VariationPopover from '@/pages/products/edit-product/variants/variation-popover';

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

type AddOrEditVariationProps = {
  type: string | null;
  variationErrors: FormErrors;
  setVariationErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  formData: AttributeFormState | undefined;
  setFormData: React.Dispatch<
    React.SetStateAction<AttributeFormState | undefined>
  >;
};

const AddOrEditVariation = ({
  type,
  variationErrors,
  setVariationErrors,
  formData,
  setFormData,
}: AddOrEditVariationProps) => {
  const dispatch = useAppDispatch();
  const { loaded, data: allAttributesList } = useAppSelector(
    (state) => state.attributes,
  );
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
  }, [loaded, formData?.id]);

  const generateVariationSuggestionArray = (
    searchText = searchedText,
    attrId = formData?.id,
    selectedValues = formData?.values,
  ) => {
    if (!attrId) {
      setVariationSuggestionArray([]);
    } else {
      const currentAttributeData = (allAttributesList as Attribute[] | null)?.find(
        (item) => item?.id === attrId,
      );

      let valuesList: AttributeValue[] | undefined =
        currentAttributeData?.values;
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
    }
  };

  const handleVariationAdd = (v: SelectOption) => {
    const newValue: AttributeFormValue = {
      value: v.value,
      color: v.color as string | null | undefined,
      title: v.title,
    };

    setSearchedText('');
    generateVariationSuggestionArray('', formData?.id, [
      ...(formData?.values || []),
      newValue,
    ]);

    setFormData((prev) => ({
      ...prev,
      type: type as string,
      values: [...(prev?.values || []), newValue],
    }));

    setVariationErrors((prev) => ({
      ...prev,
      value: null,
    }));
  };

  const handleNewVariationAdd = async (
    v: string | { title?: string; color?: string },
  ) => {
    let newValue: AttributeValueFormData;
    if (type === 'color') {
      const colorValue = v as { title?: string; color?: string };
      newValue = {
        attribute_id: formData?.id as number,
        value: colorValue.title,
        color: colorValue.color,
      };
    } else {
      newValue = {
        attribute_id: formData?.id as number,
        value: v as string,
        color: undefined,
      };
    }
    const result = await addAttributeValueAPI(newValue);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      const resultData = result.data as AttributeValue;
      const { value, id, color } = resultData;
      const addedValue: AttributeFormValue = {
        value: id,
        title: value,
        color: color,
      };
      setFormData((prev) => ({
        ...prev,
        values: [addedValue, ...(prev?.values || [])],
      }));
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setVariationErrors(getErrorsObject(errorPayload.errors));
      console.log(result, 'error');
    }
  };

  const handleVariationRemove = (v: SelectOption) => {
    const newList = formData?.values?.filter(
      (item) => item?.value !== v?.value,
    );
    setFormData((prev) => ({
      ...prev,
      type: type as string,
      values: newList,
    }));
    if (v.value) {
      setSearchedText('');
      generateVariationSuggestionArray('', formData?.id, newList);
    }
    setVariationErrors((prev) => ({
      ...prev,
      value: null,
    }));
  };

  const handleSearchChange = (searchText: string) => {
    const keyword = searchText?.trim();
    setSearchedText(keyword);
    generateVariationSuggestionArray(searchText);
    setVariationErrors((prev) => ({
      ...prev,
      value: null,
    }));
  };

  return (
    <>
      <TagManager
        error={variationErrors?.value as string | boolean | undefined}
        label={__('Variation Values', 'kirki-ecommerce')}
        placeholder={__('Add', 'kirki-ecommerce')}
        suggestions={variationSuggestionArray}
        selectedTags={formData?.values as SelectOption[]}
        value={searchedText}
        searchKey={formData?.values as unknown as string}
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
      <VariationPopover
        isOpen={addNewVariationPopup}
        onClose={() => setAddNewVariationPopup(false)}
        onSave={(v) => handleNewVariationAdd(v)}
      />
    </>
  );
};

export default AddOrEditVariation;
