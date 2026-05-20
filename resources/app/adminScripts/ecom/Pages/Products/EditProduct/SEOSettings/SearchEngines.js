import { Input } from "molecules";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProduct } from "../../../../store/productSlice";
import { __ } from "wpi18n";

const SearchEngines = ({ errors, setErrors }) => {
  // TODO: Update desgin
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);

  const handleOnChange = (value, fieldName) => {
    dispatch(updateProduct({ key: fieldName, value: value }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  return (
    <>
      <Input
        label={__("Title", "kirki-ecommerce")}
        placeholder={__("e.g. Example T-shirt", "kirki-ecommerce")}
        type="text"
        value={productData?.seo_title}
        onChange={(value) => handleOnChange(value, "seo_title")}
        error={errors?.seo_title}
      />
      <Input
        label={__("Meta description", "kirki-ecommerce")}
        placeholder={__("e.g. Cotton shirts from our store.", "kirki-ecommerce")}
        multiline={5}
        value={productData?.seo_description}
        onChange={(value) => handleOnChange(value, "seo_description")}
        error={errors?.seo_description}
      />
    </>
  );
};

export default SearchEngines;
