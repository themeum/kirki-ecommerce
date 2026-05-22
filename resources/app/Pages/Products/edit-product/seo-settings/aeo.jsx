import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProduct } from "../../../../store/productSlice";
import Input from '@/molecules/input';
import { __ } from "@/wpi18n";

const AEO = ({ errors, setErrors }) => {
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
    <Input
      label={__("LLM Instruction", "kirki-ecommerce")}
      multiline={5}
      value={productData?.llm_instructions}
      error={errors?.llm_instructions}
      onChange={(value) => handleOnChange(value, "llm_instructions")}
      placeholder={__("llm instructions", "kirki-ecommerce")}
    />
  );
};

export default AEO;
