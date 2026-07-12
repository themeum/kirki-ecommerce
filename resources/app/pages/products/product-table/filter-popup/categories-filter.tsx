import { useEffect, useState } from 'react';

import { TagManager } from '@/molecules/tag-manager';
import { useCategoriesQuery } from '@/services/category';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type FilterObject = {
  category_ids?: number[];
};

type CategoriesFilterProps = {
  filterObject: FilterObject;
  onChange?: (val: number[]) => void;
};

const CategoriesFilter = ({
  filterObject,
  onChange = () => {},
}: CategoriesFilterProps) => {
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });

  const [suggestionArray, setSuggestionArray] = useState<SelectOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<SelectOption[]>([]);

  useEffect(() => {
    if (!categoriesData?.results) {
      return;
    }
    const selectedList = categoriesData.results
      .filter((category) =>
        Array.isArray(filterObject?.category_ids)
          ? filterObject.category_ids.includes(category.id)
          : false,
      )
      .map((item) => ({
        value: item.id,
        title: item.name,
      }));
    setSelectedCategories(selectedList);
  }, [categoriesData]);

  useEffect(() => {
    const suggestionList = categoriesData?.results
      .filter((category) =>
        Array.isArray(filterObject?.category_ids)
          ? !filterObject.category_ids.includes(category.id)
          : true,
      )
      .map((item) => ({
        value: item.id,
        title: item.name,
      }));
    setSuggestionArray(suggestionList || []);
  }, [categoriesData, filterObject]);

  const handleAddCategory = (tag: SelectOption) => {
    const updatedCategoryList = [...selectedCategories, tag];
    setSelectedCategories(updatedCategoryList);

    const updatedSuggestions = suggestionArray?.filter(
      (item) => item.value !== tag.value,
    );
    setSuggestionArray(updatedSuggestions);

    const updatedIdList = [
      ...((filterObject?.category_ids as number[]) || []),
      tag.value as number,
    ];
    onChange(updatedIdList);
  };

  const handleCategoryRemove = (tag: SelectOption) => {
    const updatedCategoryList = selectedCategories?.filter(
      (item) => item.value !== tag.value,
    );
    setSelectedCategories(updatedCategoryList);

    setSuggestionArray((prev) => [tag, ...prev]);

    const updatedIdList = (filterObject?.category_ids as number[])?.filter(
      (item) => item !== tag.value,
    );

    onChange(updatedIdList || []);
  };

  return (
    <TagManager
      label={__('Categories', 'kirki-ecommerce')}
      placeholder={__('Select Categories...', 'kirki-ecommerce')}
      selectedTags={selectedCategories}
      suggestions={suggestionArray}
      hasAddBtn={false}
      onTagAdd={(tag) => {
        handleAddCategory(tag);
      }}
      onTagRemove={(tag) => {
        handleCategoryRemove(tag);
      }}
    />
  );
};

CategoriesFilter.displayName = 'CategoriesFilter';

export default CategoriesFilter;
