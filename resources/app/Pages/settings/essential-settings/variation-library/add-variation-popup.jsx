import React, { useState } from "react";

import Flex from '@/molecules/flex';
import Input from '@/molecules/input';

import Button from '@/molecules/button';
import { __ } from "@/wpi18n";
import { useDispatch } from "react-redux";
import { Popover, PopoverBody, PopoverFooter, PopoverHeader } from '@/molecules/popover';

import {
  addAttributeAPI,
  setKeyValue,
} from "../../../../store/attributesSlice";
import { getErrorsObject } from "../../../../store/utils";

const AddVariationPopup = (props) => {
  const { isOpen, onClose, variationType } = props;
  const dispatch = useDispatch();
  const [variationName, setVariationName] = useState("");
  const [errors, setErrors] = useState({});

  const handleAddNewVariation = async () => {
    let result = [];
    const newAttribute = {
      name: variationName,
      type: variationType,
    };
    result = await addAttributeAPI(newAttribute);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      onClose();
    } else {
      setErrors(getErrorsObject(result?.errors));
    }
    setVariationName("");
  };

  const handleClosePopup = () => {
    setVariationName("");
    onClose();
  };

  const buttonState = variationName === "" ? "disabled" : "default";
  return (
    <div>
      <Popover
        isOpen={isOpen}
        style={{ width: "400px" }}
        onClose={handleClosePopup}
      >
        <PopoverHeader
          style={{ padding: "var(--decom-spacing-5)" }}
          onClose={handleClosePopup}
        >
          {__("Add Variation Name", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding:
              "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)",
          }}
        >
          <Flex direction="column" gap={16}>
            <Input
              label={__("Title", "kirki-ecommerce")}
              placeholder={__(
                variationType === "color" ? "e.g Color" : "e.g Material",
                "kirki-ecommerce"
              )}
              onChange={(value) => {
                setVariationName(value);
                setErrors({ name: "" });
              }}
              error={errors["name"]}
            />
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            text={__("Cancel", "kirki-ecommerce")}
            type="outlined"
            size="small"
            onClick={handleClosePopup}
          />
          <Button
            text={__("Save", "kirki-ecommerce")}
            type="primary"
            size="small"
            state={buttonState}
            onClick={handleAddNewVariation}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

export default AddVariationPopup;
