import React, { useEffect, useState } from 'react';

import { useGetListAPI } from '@/hooks';
import { TagManager } from '@/molecules/tag-manager';
import { makeSuggestionList } from '@/pages/utils';
import {
  addCollectionAPI,
  getCollectionsAPI,
  setKeyValue,
} from '@/store/collectionsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProduct } from '@/store/productSlice';
import { getErrorsObject } from '@/store/utils';
import type { Collection, FormErrors, SuggestionOption } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

type CollectionsProps = {
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
};

const Collections = ({ errors, setErrors }: CollectionsProps) => {
  const dispatch = useAppDispatch();

  const { data: productData } = useAppSelector((state) => state.product);
  const { data: collectionData } = useAppSelector((state) => state.collections);
  useGetListAPI({
    reducerName: 'collections',
    limit: -1,
    apiCallBack: getCollectionsAPI,
  });

  const [suggestionArray, setSuggestionArray] = useState<SuggestionOption[]>(
    [],
  );
  const [selectedTags, setSelectedTags] = useState<SuggestionOption[]>([]);
  const [localError, setLocalError] = useState<FormErrors>({});

  useEffect(() => {
    setLocalError({ title: errors?.collections });
  }, [errors]);

  useEffect(() => {
    const productCollections = (productData?.collections ||
      []) as unknown as Collection[];
    const selectedList = productCollections.map((item) => ({
      value: item.id,
      title: item.title,
    }));
    setSelectedTags(selectedList);
    const suggestionList = makeSuggestionList(
      collectionData?.results,
      selectedList,
    );
    setSuggestionArray(suggestionList);
  }, [productData, collectionData]);

  const handleAddTag = (tag: SuggestionOption) => {
    const updatedLocalCollectionList = [...selectedTags, tag];
    setSelectedTags(updatedLocalCollectionList);

    const productCollections = (productData?.collections ||
      []) as unknown as Collection[];
    const updatedCollectionList = [
      { id: tag.value as number, title: tag.title },
      ...productCollections,
    ];
    dispatch(
      updateProduct({ key: 'collections', value: updatedCollectionList }),
    );
    const updatedSuggestions = suggestionArray.filter(
      (item) => item.value !== tag.value,
    );
    setSuggestionArray(updatedSuggestions);
    setErrors((prev) => ({
      ...prev,
      collections: null,
    }));
  };

  const handleTagRemove = (tag: SuggestionOption) => {
    const updatedLocalCollectionList = selectedTags.filter(
      (item) => item.value !== tag.value,
    );
    setSelectedTags(updatedLocalCollectionList);

    const productCollections = (productData?.collections ||
      []) as unknown as Collection[];
    const updatedCollectionList = productCollections.filter(
      (item) => item.id !== tag.value,
    );
    dispatch(
      updateProduct({ key: 'collections', value: updatedCollectionList }),
    );
    setSuggestionArray((prev) => [tag, ...prev]);

    setErrors((prev) => ({
      ...prev,
      collections: null,
    }));
  };

  const handleSearchChange = (searchText: string) => {
    dispatch(setKeyValue({ key: 'search', value: searchText }));
    setErrors((prev) => ({
      ...prev,
      collections: null,
    }));
  };

  const handleAddNewTag = async (tagTitle: string) => {
    const collectionFormData = { title: tagTitle };
    const result = await addCollectionAPI(collectionFormData);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      handleAddTag({
        value: (result.data as Collection).id,
        title: tagTitle,
      });
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setLocalError(getErrorsObject(errorPayload.errors));
    }
  };

  return (
    <TagManager
      label={__('Collections', 'kirki-ecommerce')}
      selectedTags={selectedTags || []}
      suggestions={suggestionArray || []}
      btnText={__('Add Collection', 'kirki-ecommerce')}
      error={localError?.title as string | boolean | undefined}
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

export default Collections;
