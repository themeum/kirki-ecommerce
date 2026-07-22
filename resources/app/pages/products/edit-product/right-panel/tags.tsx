import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getErrorsObject, type ErrorResponse } from '@/libs/api';
import TagManager from '@/components/tag-manager/tag-manager';
import { makeSuggestionList } from '@/pages/utils';
import type { ProductRightPanelFormValues } from '@/schemas/forms/product-right-panel-form';
import { useCreateTagMutation, useTagsQuery } from '@/services/tag';
import type { SuggestionOption } from '@/types';
import { __ } from '@/wpi18n';

const Tags = () => {
  const { control, setValue, watch, setError, clearErrors } =
    useFormContext<ProductRightPanelFormValues>();
  const selectedTagsValue = watch('tags') || [];
  const { data: tagData } = useTagsQuery({ limit: -1 });
  const createTagMutation = useCreateTagMutation();

  const [suggestionArray, setSuggestionArray] = useState<SuggestionOption[]>(
    [],
  );

  const selectedTags: SuggestionOption[] = selectedTagsValue.map((item) => ({
    value: item.id,
    title: item.name,
  }));

  useEffect(() => {
    const suggestionList = makeSuggestionList(tagData?.results, selectedTags);
    setSuggestionArray(suggestionList);
  }, [selectedTagsValue, tagData]);

  const handleAddTag = (tag: SuggestionOption) => {
    const updatedTagList = [
      { id: tag.value as number, name: tag.title },
      ...selectedTagsValue,
    ];
    setValue('tags', updatedTagList, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors('tags');
    setSuggestionArray((prev) =>
      prev.filter((item) => item.value !== tag.value),
    );
  };

  const handleTagRemove = (tag: SuggestionOption) => {
    const updatedTagList = selectedTagsValue.filter(
      (item) => item.id !== tag.value,
    );
    setValue('tags', updatedTagList, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSuggestionArray((prev) => [tag, ...prev]);
    clearErrors('tags');
  };

  const handleSearchChange = (_searchText: string) => {
    clearErrors('tags');
  };

  const handleAddNewTag = async (tagTitle: string) => {
    try {
      const response = await createTagMutation.mutateAsync({ name: tagTitle });
      handleAddTag({ value: response.data.id, title: tagTitle });
    } catch (error) {
      const fieldErrors = getErrorsObject((error as ErrorResponse).errors);
      if (fieldErrors.name) {
        setError('tags', { message: String(fieldErrors.name) });
      }
    }
  };

  return (
    <FormField
      control={control}
      name="tags"
      render={({ fieldState }) => (
        <FormItem>
          <FormLabel>{__('Tags', 'kirki-ecommerce')}</FormLabel>
          <FormControl>
            <TagManager
              selectedTags={selectedTags || []}
              suggestions={suggestionArray || []}
              error={Boolean(fieldState.error)}
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
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

Tags.displayName = 'Tags';

export default Tags;
