import { ColorPaletteIcon, ListIcon } from "@/Icons";
import { ActionGroup, Button, Card, Flex, Searchbox } from "@/molecules";
import React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import { useState } from "react";
import {
  addAttributeAPI,
  getAttributesAPI,
  setKeyValue,
} from "../../../../../store/attributesSlice";
import { getErrorsObject } from "../../../../../store/utils";
import {
  updateProduct,
  updateProductAttributes,
} from "../../../../../store/productSlice";
import { useGetListAPI } from "@/hooks";
import AddOrEditVariation from "./AddOrEditVariation";

const AddOrEditAttribute = (props) => {
  const { onClose, data, onSave = () => {} } = props;

  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
  const { attributes: productAttributes, variants } = productData;
  useGetListAPI({
    reducerName: "attributes",
    apiCallBack: getAttributesAPI,
    limit: -1,
  });
  const { loaded, data: allAttributesList } =
    useSelector((state) => state.attributes) || [];
  const [formData, setFormData] = useState(data);
  const [type, setType] = useState(data?.values?.[0]?.color ? "color" : "list");
  const [attributeSuggestionArray, setAttributeSuggestionArray] = useState([]);
  const [variationErrors, setVariationErrors] = useState({});

  useEffect(() => {
    // This effect is for attribute search update
    if (loaded) {
      generateAttributeSuggestionArray();
    }
  }, [allAttributesList, type]);

  useEffect(() => {
    if (loaded && data) {
      const selectedvalues = formData?.values?.map((item) => ({
        ...item,
        title: item?.value,
        value: item?.id,
      }));
      setFormData({ ...formData, values: selectedvalues });
    }
  }, [loaded, data]);

  const generateAttributeSuggestionArray = () => {
    const allAttributes = allAttributesList
      .map((item) => ({
        value: item?.id,
        title: item?.name,
        type: item?.type,
      }))
      .filter(
        (attr) =>
          attr.type === type &&
          !productAttributes.some((val) => val.id === attr.value),
      );
    setAttributeSuggestionArray(allAttributes);
  };

  const handleSaveAttribute = async () => {
    const formattedValues = formData?.values.map((item) => ({
      id: item?.value,
      value: item?.title,
      color: item?.color,
    }));

    let attribuleList = productAttributes;
    if (data?.id) {
      attribuleList = productAttributes.map((item) =>
        item.id === data?.id
          ? {
              id: formData?.id,
              name: formData?.name,
              values: formattedValues,
            }
          : item,
      );
    } else {
      attribuleList = [
        ...attribuleList,
        {
          id: formData?.id,
          name: formData?.name,
          values: formattedValues,
        },
      ];
    }

    const result = await onSave();

    if (result?.success) {
      console.log(result, "success");
      dispatch(updateProductAttributes(attribuleList));
      dispatch(updateProduct({ key: "has_variants", value: true }));
      handleOnClose();
    } else {
      console.log(result, "error");
    }
  };

  const handleAttributeSelect = (v) => {
    const { title, value } = v;
    setFormData({
      name: title,
      id: value,
      type: type,
      values: [],
    });
    setVariationErrors((prev) => ({
      ...prev,
      attribute_id: null,
      name: null,
    }));
  };

  const handleAttributeSearchChange = (v) => {
    setFormData((prev) => ({
      ...prev,
      name: v,
      type: type,
    }));
    dispatch(setKeyValue({ key: "search", value: v }));
    setVariationErrors((prev) => ({
      ...prev,
      attribute_id: null,
      name: null,
    }));
  };

  const handleNewAttributeAdd = async (value) => {
    let result = [];
    const newAttribute = {
      name: value,
      type: type,
    };
    result = await addAttributeAPI(newAttribute);
    if (result.success) {
      dispatch(setKeyValue({ key: "search", value: "" }));
      const { id, name, slug, type, values } = result.data;
      setFormData({ id, name, slug, type, values });
    } else {
      setVariationErrors(getErrorsObject(result.errors));
      console.log(result, "error");
    }
  };

  const handleClearAttributeName = () => {
    const isListed = attributeSuggestionArray.some(
      (item) => item.value === formData?.id,
    );
    if (!isListed) {
      const clearedData = {
        value: formData?.id,
        title: formData?.name,
        type: type,
      };
      setAttributeSuggestionArray((prev) => [...prev, clearedData]);
    }
    setFormData({});
  };

  const handleOnClose = () => {
    setFormData({});
    setType(null);
    setAttributeSuggestionArray([]);
    onClose();
  };

  const handleOnTypeChange = (type) => {
    setType(type);
    setFormData({});
    setVariationErrors((prev) => ({
      ...prev,
      attribute_id: null,
      name: null,
      value: null,
    }));
  };

  return (
    <>
      <Card type="inner">
        <Flex direction="column" gap={16}>
          {!data && (
            <Flex direction="column" gap={8}>
              <div>{__("Show in Product page as", "kirki-ecommerce")}</div>
              <Flex
                style={{
                  border: "1px solid #eeedf3",
                  borderRadius: "8px",
                  width: "max-content",
                }}
              >
                <Button
                  type="outlined"
                  text={__("List", "kirki-ecommerce")}
                  leftIcon={<ListIcon />}
                  size="large"
                  style={{
                    borderColor: type === "list" ? "#5641f3" : "transparent",
                  }}
                  onClick={() => handleOnTypeChange("list")}
                  // state={type === "color" && formData?.id ? "disabled" : ""}
                />
                <Button
                  type="outlined"
                  text={__("Color", "kirki-ecommerce")}
                  leftIcon={<ColorPaletteIcon />}
                  size="large"
                  style={{
                    borderColor: type === "color" ? "#5641f3" : "transparent",
                  }}
                  onClick={() => handleOnTypeChange("color")}
                  // state={type === "list" && formData?.id ? "disabled" : ""}
                />
              </Flex>
            </Flex>
          )}
          <Searchbox
            error={variationErrors?.name || variationErrors?.attribute_id}
            value={formData?.name || ""}
            label={__("Variation Name", "kirki-ecommerce")}
            placeholder={__("e.g. Size or Material", "kirki-ecommerce")}
            onChange={(value) => handleAttributeSearchChange(value)}
            hasIcon={false}
            suggestionArray={attributeSuggestionArray}
            onOptionClick={(value) => handleAttributeSelect(value)}
            onEnter={(value) => handleNewAttributeAdd(value)}
            onNewOptionAdd={(value) => handleNewAttributeAdd(value)}
            hasAddBtn
            btnText="Add Attribute"
            onClearInput={formData?.name ? handleClearAttributeName : null}
            readOnly={formData?.id}
            state={formData?.id ? "disabled" : ""}
          />
          <AddOrEditVariation
            type={type}
            variationErrors={variationErrors}
            setVariationErrors={setVariationErrors}
            formData={formData}
            setFormData={setFormData}
          />

          <ActionGroup>
            <Button
              type="secondary"
              text={__("Cancel", "kirki-ecommerce")}
              onClick={handleOnClose}
            />
            <Button
              type="primary"
              text={__("Apply", "kirki-ecommerce")}
              state={
                formData?.id && formData?.values.length > 0 ? "" : "disabled"
              }
              onClick={handleSaveAttribute}
            />
          </ActionGroup>
        </Flex>
      </Card>
    </>
  );
};

export default AddOrEditAttribute;
