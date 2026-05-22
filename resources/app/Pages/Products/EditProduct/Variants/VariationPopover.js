import {
  Button,
  ColorPicker,
  Flex,
  Input,
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from "@/molecules";
import React from "react";
import { useState } from "react";
import { __ } from "@/wpi18n";

const VariationPopover = ({
  isOpen,
  onClose = () => {},
  onSave = () => {},
}) => {
  const [newVariation, setNewVariation] = useState({
    title: "",
    value: "",
    color: "",
  });
  const onTitleChange = (value) => {
    setNewVariation((prev) => ({
      ...prev,
      title: value,
      value: value,
    }));
  };
  const onColorChange = (value) => {
    setNewVariation((prev) => ({
      ...prev,
      color: value,
    }));
  };
  const handleNewValueSave = () => {
    onSave(newVariation);
    setNewVariation({});
    onClose();
  };

  const btnState =
    newVariation?.value === "" || newVariation?.color === "" ? "disabled" : "";

  return (
    <Popover isOpen={isOpen} style={{ width: "365px" }} onClose={onClose}>
      <PopoverHeader style={{ padding: "20px" }} onClose={onClose}>
        {__("Add Color", "kirki-ecommerce")}
      </PopoverHeader>
      <PopoverBody style={{ padding: "0 20px 20px 20px" }}>
        <Flex direction="column" gap={16}>
          <Input
            label={__("Title", "kirki-ecommerce")}
            placeholder={__("Cerulean", "kirki-ecommerce")}
            onChange={onTitleChange}
            value={newVariation.title}
          />
          <ColorPicker
            value={newVariation.color}
            onChange={(value) => onColorChange(value)}
            label={__("Color", "kirki-ecommerce")}
            placeholder={__("#007ba7", "kirki-ecommerce")}
          />
        </Flex>
      </PopoverBody>
      <PopoverFooter style={{ padding: "20px" }}>
        <Button
          text={__("Cancel", "kirki-ecommerce")}
          type="outlined"
          size="small"
          onClick={onClose}
        />
        <Button
          text={__("Save", "kirki-ecommerce")}
          type="primary"
          size="small"
          state={btnState}
          onClick={handleNewValueSave}
        />
      </PopoverFooter>
    </Popover>
  );
};

export default VariationPopover;
