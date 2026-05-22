import {
  Button,
  Flex,
  Input,
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
  Text,
} from "@/molecules";
import React from "react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { getErrorsObject } from "../../store/utils";
import {
  addTagAPI,
  setKeyValue,
  updateTag,
  updateTagAPI,
} from "../../store/tagsSlice";
import { TagIcon } from "@/Icons";
import { __ } from "@/wpi18n";

const TagAddEditPopover = ({ tag, onClose = () => {} }) => {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({});
  const [tagFormData, setTagFormData] = useState(tag);

  const handleOnChange = (data, fieldName) => {
    setTagFormData((prev) => ({
      ...prev,
      [fieldName]: data,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  const handleAddOrUpdateTag = async () => {
    let result = {};
    if (tagFormData.id) {
      result = await updateTagAPI(tagFormData.id, tagFormData);
    } else {
      result = await addTagAPI(tagFormData);
    }
    if (result.success) {
      if (tagFormData.id) {
        console.log(result);
        dispatch(updateTag(result.data));
      } else {
        dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      }
      onClose();
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };

  return (
    <>
      <Popover isOpen={true} onClose={onClose}>
        <PopoverHeader
          onClose={onClose}
          leftIcon={<TagIcon />}
          style={{ borderBottom: "1px solid #E4E3E9" }}
        >
          <Text
            type="primary"
            header={
              tagFormData.id ? __("Edit Tag", "kirki-ecommerce") : __("New Tag", "kirki-ecommerce")
            }
          />
        </PopoverHeader>
        <PopoverBody>
          <Flex direction="column" gap={16}>
            <Input
              label={__("Name", "kirki-ecommerce")}
              placeholder={__("e.g., fundraising", "kirki-ecommerce")}
              value={tagFormData.name}
              onChange={(value) => handleOnChange(value, "name")}
              error={errors.name}
            />
            <Input
              label={__("Slug", "kirki-ecommerce")}
              placeholder={__("e.g., fund-raising", "kirki-ecommerce")}
              value={tagFormData.slug}
              onChange={(value) => handleOnChange(value, "slug")}
              error={errors.slug}
            />
            <Input
              label={__("Description", "kirki-ecommerce")}
              multiline={2}
              style={{ padding: "8px 12px" }}
              error={errors.description}
              value={tagFormData.description}
              onChange={(value) => handleOnChange(value, "description")}
              placeholder={__(
                "e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.",
                "kirki-ecommerce",
              )}
            />
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__("Cancel", "kirki-ecommerce")}
            onClick={onClose}
          />
          <Button
            type="primary"
            text={tagFormData.id ? __("Save", "kirki-ecommerce") : __("Add", "kirki-ecommerce")}
            onClick={handleAddOrUpdateTag}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

export default TagAddEditPopover;
