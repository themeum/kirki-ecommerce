import React, { useState } from "react";
import { groupDetails, optionsList, requiredFields } from "./utils";
import GroupTagTable from "../../../../components/GroupTagTable";
import { Card, Flex, Select } from "molecules";
import { useDispatch, useSelector } from "react-redux";
import { updateProduct } from "../../../../store/productSlice";
import { __ } from "wpi18n";

const Schema = ({ errors, setErrors }) => {
  const dispatch = useDispatch();
  const { data: productData } = useSelector((state) => state.product);
  const [selectedValues, setSelectedValues] = useState({
    Product: ["name"],
    Offer: ["price"],
  });

  const handleOnChange = (value, fieldName) => {
    dispatch(updateProduct({ key: fieldName, value: value }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleOnSelectionChange = (value) => {
    setSelectedValues(value);
  };

  // TODO: update schema profile list after settings panel is merged

  return (
    <Flex direction="column" gap={16}>
      <Select
        label={__("Schema", "kirki-ecommerce")}
        optionsArray={[
          { value: "default", title: __("Default SEO Profile", "kirki-ecommerce") },
          { value: "custom", title: __("Custom SEO Profile", "kirki-ecommerce") },
        ]}
        value={productData?.schema_id}
        onChange={(value) => handleOnChange(value, "schema_id")}
        error={errors?.schema_id}
      />
      <GroupTagTable
        groupDetails={groupDetails}
        selectedValues={selectedValues}
        optionsArray={optionsList}
        optionsList={optionsList}
        requiredFields={requiredFields}
        onChange={(value) => handleOnSelectionChange(value)}
        hasSelect
        isEditable
      />
      <Card type="inner">askjdasjdajosidaosij</Card>
    </Flex>
  );
};

export default Schema;
