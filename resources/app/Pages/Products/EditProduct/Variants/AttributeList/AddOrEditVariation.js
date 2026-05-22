import { TagManager } from "@/molecules";
import React from "react";
import { __ } from "@/wpi18n";
import {
  addAttributeValueAPI,
  setKeyValue,
} from "../../../../../store/attributesSlice";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { PlusIcon } from "@/Icons";
import VariationPopover from "../VariationPopover";
import { useEffect } from "react";
import { getErrorsObject } from "../../../../../store/utils";
import { getSearchedValue } from "../../../../Settings/utils";

const AddOrEditVariation = ({
  type,
  variationErrors,
  setVariationErrors,
  formData,
  setFormData,
}) => {
  const dispatch = useDispatch();
  const { loaded, data: allAttributesList } =
    useSelector((state) => state.attributes) || [];
  const [addNewVariationPopup, setAddNewVariationPopup] = useState(false);
  const [variationSuggestionArray, setVariationSuggestionArray] = useState([]);
  const [searchedText, setSearchedText] = useState("");

  useEffect(() => {
    if (loaded) {
      setSearchedText("");
      generateVariationSuggestionArray();
    }
  }, [loaded, formData?.id]);

  const generateVariationSuggestionArray = (
    searchText = searchedText,
    attrId = formData?.id,
    selectedValues = formData?.values
  ) => {
    if (!attrId) setVariationSuggestionArray([]);
    else {
      const currentAttributeData = allAttributesList?.find(
        (item) => item?.id === attrId
      );

      let valuesList = currentAttributeData?.values;
      if (searchText) {
        valuesList = getSearchedValue(searchText, valuesList);
      }

      const variationArray = valuesList
        ?.map((item) => ({
          value: item?.id,
          color: item?.color,
          title: item?.value,
        }))
        .filter(
          (data) =>
            !selectedValues?.some(
              (v) => v.id === data?.value || v?.value === data?.value
            )
        );

      setVariationSuggestionArray(variationArray);
    }
  };

  const handleVariationAdd = (v) => {
    const newValue = { value: v.value, color: v.color, title: v.title };

    // need to check later

    // const updatedSuggestion = variationSuggestionArray?.filter(
    //   (item) => item.value !== v.value
    // );

    setSearchedText("");
    generateVariationSuggestionArray("", formData?.id, [
      ...formData?.values,
      newValue,
    ]);

    setFormData((prev) => ({
      ...prev,
      type: type,
      values: [...prev.values, newValue],
    }));

    setVariationErrors((prev) => ({
      ...prev,
      value: null,
    }));
  };

  const handleNewVariationAdd = async (v) => {
    let result = [];
    let newValue = {};
    if (type === "color") {
      newValue = {
        attribute_id: formData?.id,
        value: v.title,
        color: v.color,
      };
    } else {
      newValue = {
        attribute_id: formData?.id,
        value: v,
        color: null,
      };
    }
    result = await addAttributeValueAPI(newValue);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      const { value, id, color } = result.data;
      const newValue = {
        value: id,
        title: value,
        color: color,
      };
      setFormData((prev) => ({
        ...prev,
        values: [newValue, ...prev.values],
      }));
    } else {
      setVariationErrors(getErrorsObject(result.errors));
      console.log(result, "error");
    }
  };

  const handleVariationRemove = (v) => {
    const newList = formData?.values?.filter(
      (item) => item?.value !== v?.value
    );
    setFormData((prev) => ({
      ...prev,
      type: type,
      values: newList,
    }));
    if (v.value) {
      setSearchedText("");
      generateVariationSuggestionArray("", formData?.id, newList);
    }
    setVariationErrors((prev) => ({
      ...prev,
      value: null,
    }));
  };

  const handleSearchChange = (searchText) => {
    setSearchedText(keyword);
    const keyword = searchText?.trim();
    generateVariationSuggestionArray(searchText);
    setVariationErrors((prev) => ({
      ...prev,
      value: null,
    }));
  };

  return (
    <>
      <TagManager
        error={variationErrors?.value}
        label={__("Variation Values", "kirki-ecommerce")}
        placeholder={__("Add", "kirki-ecommerce")}
        suggestions={variationSuggestionArray}
        selectedTags={formData?.values}
        value={searchedText}
        searchKey={formData?.values}
        onTagAdd={(value) => handleVariationAdd(value)}
        btnText="Add Variation"
        onSearchChange={(searchValue) => handleSearchChange(searchValue)}
        onNewTagAdd={(value) =>
          type === "color"
            ? setAddNewVariationPopup(true)
            : handleNewVariationAdd(value)
        }
        onTagRemove={(value) => handleVariationRemove(value)}
        leftIcon={<PlusIcon />}
        type="list"
      />
      <VariationPopover
        isOpen={addNewVariationPopup}
        onClose={() => setAddNewVariationPopup(false)}
        onSave={(v) => handleNewVariationAdd(v)}
      />
    </>
  );
};

export default AddOrEditVariation;
