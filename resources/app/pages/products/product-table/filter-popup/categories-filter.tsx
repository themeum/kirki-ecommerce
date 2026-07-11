import { useEffect, useState } from 'react';

import { useGetListAPI } from '@/hooks';
import { TagManager } from '@/molecules/tag-manager';
import {
  getCategoriesAPI,
  setKeyValue,
} from '@/store/categoriesSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type ProductFilterState = {
  category_ids?: number[] | string;
  status?: string;
  inventory_type?: string;
  collection_id?: string | number;
  brand_id?: string | number;
  [key: string]: unknown;
};

type CategoriesFilterProps = {
  filterObject: ProductFilterState;
  onChange?: (val: number[]) => void;
};

const CategoriesFilter = ({
  filterObject,
  onChange = () => {},
}: CategoriesFilterProps) => {
  const dispatch = useAppDispatch();
  const { loaded, data: categoriesData } = useAppSelector(
    (state) => state.categories,
  );
  useGetListAPI({
    reducerName: 'categories',
    limit: -1,
    apiCallBack: getCategoriesAPI,
  });

  const [suggestionArray, setSuggestionArray] = useState<SelectOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<SelectOption[]>(
    [],
  );
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const selectedList = categoriesData?.results
      .filter((category) =>
        Array.isArray(filterObject?.category_ids)
          ? filterObject.category_ids.includes(category.id)
          : false,
      )
      .map((item) => ({
        value: item.id,
        title: item.name,
      }));
    setSelectedCategories(selectedList || []);
  }, [loaded]);

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
  }, [categoriesData, filterObject, searchText]);

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
    dispatch(setKeyValue({ key: 'search', value: '' }));
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
    dispatch(setKeyValue({ key: 'search', value: '' }));
  };

  const handleSearchChange = (nextSearchText: string) => {
    setSearchText(nextSearchText);
    dispatch(setKeyValue({ key: 'search', value: nextSearchText }));
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
      onSearchChange={(nextSearchText) => {
        handleSearchChange(nextSearchText);
      }}
    />
  );
};

export default CategoriesFilter;
