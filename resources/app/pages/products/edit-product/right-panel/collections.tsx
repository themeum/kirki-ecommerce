import React, { useEffect, useState } from 'react';

import { TagManager } from '@/molecules/tag-manager';
import { makeSuggestionList } from '@/pages/utils';
import { useProductForm } from '@/contexts/product-form-context';
import { useCreateCollectionMutation, useCollectionsQuery } from '@/services/collection';
import { getErrorsObject } from '@/libs/api';
import type { FormErrors, SuggestionOption } from '@/types';
import { __ } from '@/wpi18n';

type CollectionsProps = {
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
};

const Collections = ({ errors, setErrors }: CollectionsProps) => {
  const { product: productData, updateProduct } = useProductForm();
  const { data: collectionData } = useCollectionsQuery({ limit: -1 });
  const createCollectionMutation = useCreateCollectionMutation();

  const [suggestionArray, setSuggestionArray] = useState<SuggestionOption[]>(
    [],
  );
  const [selectedTags, setSelectedTags] = useState<SuggestionOption[]>([]);
  const [localError, setLocalError] = useState<FormErrors>({});

  useEffect(() => {
    setLocalError({ title: errors?.collections });
  }, [errors]);

  useEffect(() => {
    const productCollections = productData?.collections || [];
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

    const productCollections = productData?.collections || [];
    const updatedCollectionList = [
      { id: tag.value as number, title: tag.title },
      ...productCollections,
    ];
    updateProduct({ key: 'collections', value: updatedCollectionList });
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

    const productCollections = productData?.collections || [];
    const updatedCollectionList = productCollections.filter(
      (item) => item.id !== tag.value,
    );
    updateProduct({ key: 'collections', value: updatedCollectionList });
    setSuggestionArray((prev) => [tag, ...prev]);

    setErrors((prev) => ({
      ...prev,
      collections: null,
    }));
  };

  const handleSearchChange = (_searchText: string) => {
    setErrors((prev) => ({
      ...prev,
      collections: null,
    }));
  };

  const handleAddNewTag = async (tagTitle: string) => {
    try {
      const response = await createCollectionMutation.mutateAsync({ title: tagTitle });
      handleAddTag({
        value: response.data.id,
        title: tagTitle,
      });
    } catch (error) {
      setLocalError(
        getErrorsObject((error as { errors?: Record<string, string[]> }).errors),
      );
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

Collections.displayName = 'Collections';

export default Collections;
