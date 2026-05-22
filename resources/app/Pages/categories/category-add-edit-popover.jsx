import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Popover from '@/molecules/popover/popover';
import PopoverBody from '@/molecules/popover/popover-body';
import PopoverFooter from '@/molecules/popover/popover-footer';
import PopoverHeader from '@/molecules/popover/popover-header';
import Select from '@/molecules/select/select';
import Text from '@/molecules/text';
import React from "react";
import { useState } from "react";
import {
  addCategoryAPI,
  setKeyValue,
  updateCategory,
  updateCategoryAPI,
} from "../../store/categoriesSlice";
import { useDispatch, useSelector } from "react-redux";
import ThumbnailSelector from '@/components/thumbnail-selector';
import { CategoryPopupIcon } from "@/icons";
import { getErrorsObject } from "../../store/utils";
import { __ } from "@/wpi18n";

const CategoryAddEditPopover = ({ category, onClose = () => {} }) => {
  const dispatch = useDispatch();
  const { results: categories } = useSelector(
    (state) => state.categories?.data,
  );
  const [imageUrl, setImageUrl] = useState(category?.image?.url || null);
  const [errors, setErrors] = useState({});
  const [categoryFormData, setCategoryFormData] = useState(category);

  const handleOnChange = (data, fieldName) => {
    console.log(data, fieldName);
    setCategoryFormData((prev) => ({
      ...prev,
      [fieldName]: data,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleMediaChange = (img) => {
    setImageUrl(img?.url);
    setCategoryFormData((prev) => ({
      ...prev,
      image: img?.id,
    }));
  };

  const handleAddOrUpdateCategory = async () => {
    let result = {};
    if (categoryFormData.id) {
      result = await updateCategoryAPI(categoryFormData.id, categoryFormData);
    } else {
      result = await addCategoryAPI(categoryFormData);
    }
    if (result.success) {
      if (categoryFormData.id) {
        dispatch(updateCategory(result.data));
      } else {
        dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      }
      onClose();
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
      <Popover isOpen={true} onClose={onClose}>
        <PopoverHeader
          onClose={onClose}
          leftIcon={<CategoryPopupIcon />}
          style={{ borderBottom: "1px solid #E4E3E9" }}
        >
          <Text
            type="primary"
            header={
              categoryFormData.id
                ? __("Edit Category", "kirki-ecommerce")
                : __("New Category", "kirki-ecommerce")
            }
          />
        </PopoverHeader>
        <PopoverBody>
          <Card type="light">
            <Flex direction="column" gap={16}>
              <Input
                label={__("Name", "kirki-ecommerce")}
                placeholder={__("e.g., Fundraising", "kirki-ecommerce")}
                value={categoryFormData.name}
                onChange={(value) => handleOnChange(value, "name")}
                error={errors.name}
              />
              <Input
                label={__("Slug", "kirki-ecommerce")}
                placeholder={__("e.g., fundraising", "kirki-ecommerce")}
                value={categoryFormData.slug}
                onChange={(value) => handleOnChange(value, "slug")}
                error={errors.slug}
              />
              <Select
                label={__("Parent", "kirki-ecommerce")}
                value={categoryFormData.parent_id}
                onChange={(value) => handleOnChange(value, "parent_id")}
                optionsArray={parentOptions}
                error={errors.parent_id}
              />

              <Input
                label={__("Description", "kirki-ecommerce")}
                multiline={2}
                style={{ padding: "8px 12px" }}
                error={errors.description}
                value={categoryFormData.description}
                onChange={(value) => handleOnChange(value, "description")}
                placeholder={__(
                  "e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.",
                  "kirki-ecommerce",
                )}
              />
              <ThumbnailSelector
                src={imageUrl}
                label={__("Thumb", "kirki-ecommerce")}
                error={errors.image}
                onChange={(img) => handleMediaChange(img)}
              />
            </Flex>
          </Card>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__("Cancel", "kirki-ecommerce")}
            onClick={onClose}
          />
          <Button
            type="primary"
            text={
              categoryFormData.id ? __("Save", "kirki-ecommerce") : __("Add", "kirki-ecommerce")
            }
            onClick={handleAddOrUpdateCategory}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

export default CategoryAddEditPopover;
