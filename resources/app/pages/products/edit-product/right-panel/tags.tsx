import React, { useEffect, useState } from 'react';

import { TagManager } from '@/molecules/tag-manager';
import { makeSuggestionList } from '@/pages/utils';
import { useProductForm } from '@/contexts/product-form-context';
import { useCreateTagMutation, useTagsQuery } from '@/services/tag';
import { getErrorsObject } from '@/libs/api';
import type { FormErrors, SuggestionOption } from '@/types';
import { __ } from '@/wpi18n';

type TagsProps = {
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
};

const Tags = ({ errors, setErrors }: TagsProps) => {
  const { product: productData, updateProduct } = useProductForm();
  const { data: tagData } = useTagsQuery({ limit: -1 });
  const createTagMutation = useCreateTagMutation();

  const [suggestionArray, setSuggestionArray] = useState<SuggestionOption[]>(
    [],
  );
  const [selectedTags, setSelectedTags] = useState<SuggestionOption[]>([]);
  const [localError, setLocalError] = useState<FormErrors>({});

  useEffect(() => {
    setLocalError({ name: errors?.tags });
  }, [errors]);

  useEffect(() => {
    const productTags = productData?.tags || [];
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

    const productTags = productData?.tags || [];
    const updatedTagList = [
      { id: tag.value as number, name: tag.title },
      ...productTags,
    ];
    updateProduct({ key: 'tags', value: updatedTagList });
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

    const productTags = productData?.tags || [];
    const updatedTagList = productTags.filter(
      (item) => item.id !== tag.value,
    );
    updateProduct({ key: 'tags', value: updatedTagList });
    setSuggestionArray((prev) => [tag, ...prev]);
    setErrors((prev) => ({
      ...prev,
      tags: null,
    }));
  };

  const handleSearchChange = (_searchText: string) => {
    setErrors((prev) => ({
      ...prev,
      tags: null,
    }));
  };

  const handleAddNewTag = async (tagTitle: string) => {
    try {
      const response = await createTagMutation.mutateAsync({ name: tagTitle });
      handleAddTag({ value: response.data.id, title: tagTitle });
    } catch (error) {
      setLocalError(
        getErrorsObject((error as { errors?: Record<string, string[]> }).errors),
      );
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

Tags.displayName = 'Tags';

export default Tags;
