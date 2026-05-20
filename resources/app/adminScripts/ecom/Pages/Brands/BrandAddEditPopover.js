import { ThumbnailSelector } from "components";
import { BrandIcon, CloudUpload } from "icons";
import {
  Button,
  Card,
  Flex,
  Input,
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
  Text,
} from "molecules";
import React from "react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { __ } from "wpi18n";
import {
  addBrandAPI,
  setKeyValue,
  updateBrand,
  updateBrandAPI,
} from "../../store/brandsSlice";
import { getErrorsObject } from "../../store/utils";

const BrandAddEditPopover = ({ brand, onClose = () => {} }) => {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({});
  const [brandFormData, setBrandFormData] = useState(brand);
  const [imageUrl, setImageUrl] = useState(brand?.logo?.url || null);

  const handleOnChange = (data, fieldName) => {
    setBrandFormData((prev) => ({
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
    setBrandFormData((prev) => ({
      ...prev,
      logo: img?.id,
    }));
  };

  const handleAddOrUpdateBrand = async () => {
    let result = {};
    if (brandFormData.id) {
      console.log(brandFormData);
      result = await updateBrandAPI(brandFormData.id, brandFormData);
    } else {
      console.log(brandFormData);
      result = await addBrandAPI(brandFormData);
    }
    if (result.success) {
      if (brandFormData.id) {
        console.log(result);
        dispatch(updateBrand(result.data));
      } else {
        dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      }
      onClose();
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };
  return (
    <Popover isOpen={true} onClose={onClose}>
      <PopoverHeader
        onClose={onClose}
        leftIcon={<BrandIcon />}
        style={{ borderBottom: "1px solid #E4E3E9" }}
      >
        <Text
          type="primary"
          header={
            brandFormData.id
              ? __("Edit Brand", "kirki-ecommerce")
              : __("New Brand", "kirki-ecommerce")
          }
        />
      </PopoverHeader>
      <PopoverBody>
        <Flex direction="column" gap={16}>
          <Card type="light">
            <Flex direction="column" gap={16}>
              <Input
                label={__("Name", "kirki-ecommerce")}
                placeholder={__("e.g., fundraising", "kirki-ecommerce")}
                value={brandFormData.name}
                onChange={(value) => handleOnChange(value, "name")}
                error={errors.name}
              />
              <Input
                label={__("Slug", "kirki-ecommerce")}
                placeholder={__("e.g., fund-raising", "kirki-ecommerce")}
                value={brandFormData.slug}
                onChange={(value) => handleOnChange(value, "slug")}
                error={errors.slug}
              />
              <Input
                label={__("Description", "kirki-ecommerce")}
                multiline={2}
                style={{ padding: "8px 12px" }}
                placeholder={__(
                  "e.g., Dedicated to providing immediate support and essential resources to communities affected by unexpected crises.",
                  "kirki-ecommerce",
                )}
                value={brandFormData.description}
                onChange={(value) => handleOnChange(value, "description")}
                error={errors.description}
              />
              <ThumbnailSelector
                src={imageUrl}
                label={__("Thumb", "kirki-ecommerce")}
                error={errors.logo}
                onChange={(img) => handleMediaChange(img)}
              />
            </Flex>
          </Card>
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
          text={brandFormData.id ? __("Save", "kirki-ecommerce") : __("Add", "kirki-ecommerce")}
          onClick={handleAddOrUpdateBrand}
        />
      </PopoverFooter>
    </Popover>
  );
};

export default BrandAddEditPopover;
