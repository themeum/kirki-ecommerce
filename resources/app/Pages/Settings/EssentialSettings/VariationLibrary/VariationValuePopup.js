import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { __ } from "@/wpi18n";
import {
  addAttributeValueAPI,
  setKeyValue,
  updateAttributeValueAPI,
} from "../../../../store/attributesSlice";
import {
  Popover,
  PopoverBody,
  PopoverHeader,
  PopoverFooter,
  Button,
  Flex,
  Input,
  ColorPicker,
} from "../../../../molecules";
import { dispatchToastMessage } from "../../../utils";

const VariationValuePopup = (props) => {
  const { isOpen, onClose, type, selectedItem, editedItem = null } = props;
  const dispatch = useDispatch();
  const [newVariation, setNewVariation] = useState({});

  useEffect(() => {
    setNewVariation({
      // title: editedItem?.title || editedItem?.name || "",
      value: editedItem?.value || "",
      color: editedItem?.color || "",
    });
  }, [editedItem]);

  const onTitleChange = (value) => {
    setNewVariation((prev) => ({
      ...prev,
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
    if (editedItem?.id) {
      handleUpdateAttributeValue(newVariation);
    } else {
      handleAddAttributeValue(newVariation);
    }
    setNewVariation({ value: "", color: "" });
    onClose();
  };

  const handleAddAttributeValue = async (v) => {
    const payload = {
      attribute_id: selectedItem?.id,
      value: v?.value,
      color: type === "color" ? v?.color : null,
    };

    try {
      const result = await addAttributeValueAPI(payload);
      handleResult(result, false);
    } catch (err) {
      dispatchToastMessage("error", {
        title: __("Something went wrong", "kirki-ecommerce"),
      });
    }
  };

  const handleUpdateAttributeValue = async (v) => {
    const payload = {
      attribute_id: selectedItem?.id,
      value_id: editedItem?.id,
      value: v?.value,
      color: type === "color" ? v?.color : null,
    };

    try {
      const result = await updateAttributeValueAPI(payload);
      handleResult(result, true);
    } catch (err) {
      dispatchToastMessage("error", {
        title: __("Something went wrong", "kirki-ecommerce"),
      });
    }
  };

  const handleResult = (result, isEdit) => {
    if (result?.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      dispatchToastMessage("success", {
        title: isEdit
          ? type === "color"
            ? __("Color updated", "kirki-ecommerce")
            : __("Value updated", "kirki-ecommerce")
          : type === "color"
          ? __("New color added", "kirki-ecommerce")
          : __("New value added", "kirki-ecommerce"),
      });
    } else {
      dispatchToastMessage("error", {
        title: result?.message?.toLowerCase().includes("duplicate")
          ? __("Value already existed", "kirki-ecommerce")
          : __("Something went wrong", "kirki-ecommerce"),
      });
    }
  };

  const btnState =
    newVariation?.value === "" ||
    (type === "color" && newVariation?.color === "")
      ? "disabled"
      : "";

  return (
    <div>
      <Popover isOpen={isOpen} style={{ width: "365px" }} onClose={onClose}>
        <PopoverHeader
          style={{ padding: "var(--decom-spacing-5)" }}
          onClose={onClose}
        >
          {type === "color"
            ? __("Add Color", "kirki-ecommerce")
            : __("Add Value", "kirki-ecommerce")}
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
              placeholder={
                type === "color"
                  ? __("Cerulean", "kirki-ecommerce")
                  : __("Add a value", "kirki-ecommerce")
              }
              onChange={onTitleChange}
              value={newVariation?.value}
            />
            {type === "color" && (
              <ColorPicker
                value={newVariation?.color}
                onChange={(value) => onColorChange(value)}
                label={__("Color", "kirki-ecommerce")}
                placeholder={__("#007ba7", "kirki-ecommerce")}
              />
            )}
          </Flex>
        </PopoverBody>
        <PopoverFooter>
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
    </div>
  );
};

export default VariationValuePopup;
