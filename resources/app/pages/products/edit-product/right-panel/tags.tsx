import React, { useEffect, useState } from 'react';

import { useGetListAPI } from '@/hooks';
import { TagManager } from '@/molecules/tag-manager';
import { makeSuggestionList } from '@/pages/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProduct } from '@/store/productSlice';
import { addTagAPI, getTagsAPI, setKeyValue } from '@/store/tagsSlice';
import { getErrorsObject } from '@/store/utils';
import type { FormErrors, SuggestionOption, Tag } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

type TagsProps = {
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
};

const Tags = ({ errors, setErrors }: TagsProps) => {
  const dispatch = useAppDispatch();
  const { data: productData } = useAppSelector((state) => state.product);
  const { data: tagData } = useAppSelector((state) => state.tags);
  useGetListAPI({
    reducerName: 'tags',
    limit: -1,
    apiCallBack: getTagsAPI,
  });

  const [suggestionArray, setSuggestionArray] = useState<SuggestionOption[]>(
    [],
  );
  const [selectedTags, setSelectedTags] = useState<SuggestionOption[]>([]);
  const [localError, setLocalError] = useState<FormErrors>({});

  useEffect(() => {
    setLocalError({ name: errors?.tags });
  }, [errors]);

  useEffect(() => {
    const productTags = (productData?.tags || []) as unknown as Tag[];
    const selectedList = productTags.map((item) => ({
      value: item.id,
      title: item.name,
    }));
    setSelectedTags(selectedList);
    const suggestionList = makeSuggestionList(tagData?.results, selectedList);
    setSuggestionArray(suggestionList);
  }, [productData, tagData]);

  const handleAddTag = (tag: SuggestionOption) => {
    const updatedLocalTagList = [...selectedTags, tag];
    setSelectedTags(updatedLocalTagList);

    const productTags = (productData?.tags || []) as unknown as Tag[];
    const updatedTagList = [
      { id: tag.value as number, name: tag.title },
      ...productTags,
    ];
    dispatch(updateProduct({ key: 'tags', value: updatedTagList }));
    setErrors((prev) => ({
      ...prev,
      tags: null,
    }));

    const updatedSuggestions = suggestionArray.filter(
      (item) => item.value !== tag.value,
    );
    setSuggestionArray(updatedSuggestions);
  };

  const handleTagRemove = (tag: SuggestionOption) => {
    const updatedLocalTagList = selectedTags.filter(
      (item) => item.value !== tag.value,
    );
    setSelectedTags(updatedLocalTagList);

    const productTags = (productData?.tags || []) as unknown as Tag[];
    const updatedTagList = productTags.filter(
      (item) => item.id !== tag.value,
    );
    dispatch(updateProduct({ key: 'tags', value: updatedTagList }));
    setSuggestionArray((prev) => [tag, ...prev]);
    setErrors((prev) => ({
      ...prev,
      tags: null,
    }));
  };

  const handleSearchChange = (searchText: string) => {
    dispatch(setKeyValue({ key: 'search', value: searchText }));
    setErrors((prev) => ({
      ...prev,
      tags: null,
    }));
  };
  const handleAddNewTag = async (tagTitle: string) => {
    const tagFormData = { name: tagTitle };
    const result = await addTagAPI(tagFormData);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      handleAddTag({ value: (result.data as Tag).id, title: tagTitle });
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setLocalError(getErrorsObject(errorPayload.errors));
    }
  };

  return (
    <TagManager
      label={__('Tags', 'kirki-ecommerce')}
      selectedTags={selectedTags || []}
      suggestions={suggestionArray || []}
      error={localError?.name as string | boolean | undefined}
      onTagAdd={(tag) => {
        handleAddTag(tag);
      }}
      onTagRemove={(tag) => {
        handleTagRemove(tag);
      }}
      onNewTagAdd={(tagTitle) => {
        handleAddNewTag(tagTitle);
      }}
      onSearchChange={(searchText) => {
        handleSearchChange(searchText);
      }}
    />
  );
};

export default Tags;
