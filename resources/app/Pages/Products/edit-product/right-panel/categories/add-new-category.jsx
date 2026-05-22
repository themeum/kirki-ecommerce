import { PlusIcon } from "@/icons";
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';

import React from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import { Select } from '@/molecules/select';

import {
  addCategoryAPI,
  setKeyValue,
} from "../../../../../store/categoriesSlice";
import { getErrorsObject } from "../../../../../store/utils";
import { useEffect } from "react";

const AddNewCategory = () => {
  const dispatch = useDispatch();
  const { results: categories } = useSelector(
    (state) => state.categories?.data,
  );
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [categoryFormData, setCategoryFormData] = useState({});

  useEffect(() => {
    setCategoryFormData({});
    setErrors({});
  }, [show]);

  const handleOnChange = (data, fieldName) => {
    setCategoryFormData((prev) => ({
      ...prev,
      [fieldName]: data,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleAddOrUpdateCategory = async () => {
    const result = await addCategoryAPI(categoryFormData);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      setShow(false);
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };

  const parentOptions = [
    {
      title: __("None", "kirki-ecommerce"),
      value: null,
    },
    ...categories.map((category) => ({
      title: category.name,
      value: category.id,
    })),
  ];
  return (
    <>
      {show ? (
        <Card type="inner">
          <Flex direction="column" gap={16}>
            <Input
              placeholder={__("Category Name", "kirki-ecommerce")}
              value={categoryFormData?.name || ""}
              onChange={(value) => handleOnChange(value, "name")}
              error={errors.name}
            />
            <Select
              placeholder={__("Select Parent", "kirki-ecommerce")}
              value={categoryFormData?.parent_id || ""}
              onChange={(value) => handleOnChange(value, "parent_id")}
              optionsArray={parentOptions}
              error={errors.parent_id}
            />
            <ActionGroup>
              <Button
                type="secondary"
                size="small"
                text={__("Cancel", "kirki-ecommerce")}
                onClick={() => setShow(false)}
              />
              <Button
                type="primary"
                size="small"
                text={__("OK", "kirki-ecommerce")}
                onClick={handleAddOrUpdateCategory}
              />
            </ActionGroup>
          </Flex>
        </Card>
      ) : (
        <Button
          type="blank"
          text={__("Create New Category", "kirki-ecommerce")}
          leftIcon={<PlusIcon />}
          onClick={() => setShow(true)}
        />
      )}
    </>
  );
};

export default AddNewCategory;
