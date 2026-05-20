import { useGetListAPI } from "hooks";
import React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addTagAPI,
  getTagsAPI,
  setKeyValue,
} from "../../../../store/tagsSlice";
import { TagManager } from "molecules";
import { useState } from "react";
import { __ } from "wpi18n";
import { makeSuggestionList } from "../../../utils";
import { updateProduct } from "../../../../store/productSlice";
import { getErrorsObject } from "../../../../store/utils";

const Tags = ({ errors, setErrors }) => {
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
  const { data: tagData } = useSelector((state) => state.tags);
  useGetListAPI({
    reducerName: "tags",
    limit: -1,
    apiCallBack: getTagsAPI,
  });

  const [suggestionArray, setSuggestionArray] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [localError, setLocalError] = useState({});

  useEffect(() => {
    setLocalError({ name: errors?.tags });
  }, [errors]);

  useEffect(() => {
    const selectedList = productData?.tags.map((item) => ({
      value: item.id,
      title: item.name,
    }));
    setSelectedTags(selectedList);
    const suggestionList = makeSuggestionList(tagData?.results, selectedList);
    setSuggestionArray(suggestionList);
  }, [productData, tagData]);

  const handleAddTag = (tag) => {
    const updatedLocalTagList = [...selectedTags, tag];
    setSelectedTags(updatedLocalTagList);

    const updatedTagList = [
      { id: tag.value, name: tag.title },
      ...productData?.tags,
    ];
    dispatch(updateProduct({ key: "tags", value: updatedTagList }));
    setErrors((prev) => ({
      ...prev,
      tags: null,
    }));

    const updatedSuggestions = suggestionArray.filter(
      (item) => item.value !== tag.value,
    );
    setSuggestionArray(updatedSuggestions);
  };

  const handleTagRemove = (tag) => {
    const updatedLocalTagList = selectedTags.filter(
      (item) => item.value !== tag.value,
    );
    setSelectedTags(updatedLocalTagList);

    const updatedTagList = productData?.tags.filter(
      (item) => item.id !== tag.value,
    );
    dispatch(updateProduct({ key: "tags", value: updatedTagList }));
    setSuggestionArray((prev) => [tag, ...prev]);
    setErrors((prev) => ({
      ...prev,
      tags: null,
    }));
  };

  const handleSearchChange = (searchText) => {
    dispatch(setKeyValue({ key: "search", value: searchText }));
    setErrors((prev) => ({
      ...prev,
      tags: null,
    }));
  };
  const handleAddNewTag = async (tagTitle) => {
    const tagFormData = { name: tagTitle };
    const result = await addTagAPI(tagFormData);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      handleAddTag({ value: result.data.id, title: tagTitle });
    } else {
      setLocalError(getErrorsObject(result.errors));
    }
  };

  return (
    <TagManager
      label={__("Tags", "kirki-ecommerce")}
      selectedTags={selectedTags || []}
      suggestions={suggestionArray || []}
      error={localError?.name}
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
