import { useGetListAPI } from "@/hooks";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { TagManager } from '@/molecules/tag-manager';

import {
  addCollectionAPI,
  getCollectionsAPI,
  setKeyValue,
} from "../../../../store/collectionsSlice";
import { makeSuggestionList } from "../../../utils";
import { useState } from "react";
import { useEffect } from "react";

import { __ } from "@/wpi18n";
import { updateProduct } from "../../../../store/productSlice";
import { getErrorsObject } from "../../../../store/utils";

const Collections = ({ errors, setErrors }) => {
  const dispatch = useDispatch();

  const { data: productData } = useSelector((state) => state.product);
  const { data: collectionData } = useSelector((state) => state.collections);
  useGetListAPI({
    reducerName: "collections",
    limit: -1,
    apiCallBack: getCollectionsAPI,
  });

  const [suggestionArray, setSuggestionArray] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [localError, setLocalError] = useState({});

  useEffect(() => {
    setLocalError({ title: errors?.collections });
  }, [errors]);

  useEffect(() => {
    const selectedList = productData?.collections.map((item) => ({
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

  const handleAddTag = (tag) => {
    const updatedLocalCollectionList = [...selectedTags, tag];
    setSelectedTags(updatedLocalCollectionList);

    const updatedCollectionList = [
      { id: tag.value, title: tag.title },
      ...productData?.collections,
    ];
    dispatch(
      updateProduct({ key: "collections", value: updatedCollectionList }),
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

  const handleTagRemove = (tag) => {
    const updatedLocalCollectionList = selectedTags.filter(
      (item) => item.value !== tag.value,
    );
    setSelectedTags(updatedLocalCollectionList);

    const updatedCollectionList = productData?.collections.filter(
      (item) => item.id !== tag.value,
    );
    dispatch(
      updateProduct({ key: "collections", value: updatedCollectionList }),
    );
    setSuggestionArray((prev) => [tag, ...prev]);

    setErrors((prev) => ({
      ...prev,
      collections: null,
    }));
  };

  const handleSearchChange = (searchText) => {
    dispatch(setKeyValue({ key: "search", value: searchText }));
    setErrors((prev) => ({
      ...prev,
      collections: null,
    }));
  };

  const handleAddNewTag = async (tagTitle) => {
    const collectionFormData = { title: tagTitle };
    const result = await addCollectionAPI(collectionFormData);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      handleAddTag({ value: result.data.id, title: tagTitle });
    } else {
      setLocalError(getErrorsObject(result.errors));
    }
  };

  return (
    <TagManager
      label={__("Collections", "kirki-ecommerce")}
      selectedTags={selectedTags || []}
      suggestions={suggestionArray || []}
      btnText={__("Add Collection", "kirki-ecommerce")}
      error={localError?.title}
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
