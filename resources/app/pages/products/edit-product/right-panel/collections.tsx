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
import {
  useCreateCollectionMutation,
  useCollectionsQuery,
} from '@/services/collection';
import type { SuggestionOption } from '@/types';
import { __ } from '@/wpi18n';

const Collections = () => {
  const { control, setValue, watch, setError, clearErrors } =
    useFormContext<ProductRightPanelFormValues>();
  const selectedCollectionsValue = watch('collections') || [];
  const { data: collectionData } = useCollectionsQuery({ limit: -1 });
  const createCollectionMutation = useCreateCollectionMutation();

  const [suggestionArray, setSuggestionArray] = useState<SuggestionOption[]>(
    [],
  );

  const selectedTags: SuggestionOption[] = selectedCollectionsValue.map(
    (item) => ({
      value: item.id,
      title: item.title,
    }),
  );

  useEffect(() => {
    const suggestionList = makeSuggestionList(
      collectionData?.results,
      selectedTags,
    );
    setSuggestionArray(suggestionList);
  }, [selectedCollectionsValue, collectionData]);

  const handleAddTag = (tag: SuggestionOption) => {
    const updatedCollectionList = [
      { id: tag.value as number, title: tag.title },
      ...selectedCollectionsValue,
    ];
    setValue('collections', updatedCollectionList, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSuggestionArray((prev) =>
      prev.filter((item) => item.value !== tag.value),
    );
    clearErrors('collections');
  };

  const handleTagRemove = (tag: SuggestionOption) => {
    const updatedCollectionList = selectedCollectionsValue.filter(
      (item) => item.id !== tag.value,
    );
    setValue('collections', updatedCollectionList, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSuggestionArray((prev) => [tag, ...prev]);
    clearErrors('collections');
  };

  const handleSearchChange = (_searchText: string) => {
    clearErrors('collections');
  };

  const handleAddNewTag = async (tagTitle: string) => {
    try {
      const response = await createCollectionMutation.mutateAsync({
        title: tagTitle,
      });
      handleAddTag({
        value: response.data.id,
        title: tagTitle,
      });
    } catch (error) {
      const fieldErrors = getErrorsObject((error as ErrorResponse).errors);
      if (fieldErrors.title) {
        setError('collections', { message: String(fieldErrors.title) });
      }
    }
  };

  return (
    <FormField
      control={control}
      name="collections"
      render={({ fieldState }) => (
        <FormItem>
          <FormLabel>{__('Collections', 'kirki-ecommerce')}</FormLabel>
          <FormControl>
            <TagManager
              selectedTags={selectedTags || []}
              suggestions={suggestionArray || []}
              btnText={__('Add Collection', 'kirki-ecommerce')}
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

Collections.displayName = 'Collections';

export default Collections;
