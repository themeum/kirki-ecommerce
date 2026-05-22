import { useGetListAPI } from "@/hooks";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCategoriesAPI,
  setKeyValue,
} from "../../../../store/categoriesSlice";
import { useState } from "react";
import { useEffect } from "react";
import { TagManager } from "@/molecules";
import { __ } from "@/wpi18n";

const CategoriesFilter = ({ filterObject, onChange = () => {} }) => {
  const dispatch = useDispatch();
  const { loaded, data: categoriesData } = useSelector(
    (state) => state.categories
  );
  useGetListAPI({
    reducerName: "categories",
    limit: -1,
    apiCallBack: getCategoriesAPI,
  });

  const [suggestionArray, setSuggestionArray] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    // only for the initial data format array[id] --> array[{title, value}]
    const selectedList = categoriesData?.results
      .filter((category) => filterObject?.category_ids?.includes(category.id))
      .map((item) => ({
        value: item.id,
        title: item.name,
      }));
    setSelectedCategories(selectedList);
  }, [loaded]);

  useEffect(() => {
    const suggestionList = categoriesData?.results
      .filter((category) => !filterObject?.category_ids?.includes(category.id))
      .map((item) => ({
        value: item.id,
        title: item.name,
      }));
    setSuggestionArray(suggestionList);
  }, [categoriesData, filterObject, searchText]);

  const handleAddCategory = (tag) => {
    const updatedCategoryList = [...selectedCategories, tag];
    setSelectedCategories(updatedCategoryList);

    const updatedSuggestions = suggestionArray?.filter(
      (item) => item.value !== tag.value
    );
    setSuggestionArray(updatedSuggestions);

    const updatedIdList = [...(filterObject?.category_ids || []), tag.value];
    onChange(updatedIdList);
    dispatch(setKeyValue({ key: "search", value: "" }));
  };

  const handleCategoryRemove = (tag) => {
    const updatedCategoryList = selectedCategories?.filter(
      (item) => item.value !== tag.value
    );
    setSelectedCategories(updatedCategoryList);

    setSuggestionArray((prev) => [tag, ...prev]);

    const updatedIdList = filterObject?.category_ids?.filter(
      (item) => item !== tag.value
    );

    onChange(updatedIdList);
    dispatch(setKeyValue({ key: "search", value: "" }));
  };

  const handleSearchChange = (searchText) => {
    setSearchText(searchText);
    dispatch(setKeyValue({ key: "search", value: searchText }));
  };

  return (
    <TagManager
      label={__("Categories", "kirki-ecommerce")}
      placeholder={__("Select Categories...", "kirki-ecommerce")}
      selectedTags={selectedCategories}
      suggestions={suggestionArray}
      hasAddBtn={false}
      onTagAdd={(tag) => {
        handleAddCategory(tag);
      }}
      onTagRemove={(tag) => {
        handleCategoryRemove(tag);
      }}
      onSearchChange={(searchText) => {
        handleSearchChange(searchText);
      }}
    />
  );
};

export default CategoriesFilter;
