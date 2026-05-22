import React, { useEffect, useState } from "react";
import { __, sprintf } from "@/wpi18n";
import Flex from '@/molecules/flex';
import Button from '@/molecules/button';
import Popover from '@/molecules/popover/popover';
import PopoverBody from '@/molecules/popover/popover-body';
import PopoverHeader from '@/molecules/popover/popover-header';
import Input from '@/molecules/input';
import PopoverFooter from '@/molecules/popover/popover-footer';
import Text from '@/molecules/text';
import ActionGroup from '@/molecules/action-group';
import { useDispatch } from "react-redux";

import GroupTagTable from '@/components/group-tag-table';
import {
  groupDetails,
  optionsList,
  requiredFields,
} from "../../../products/edit-product/seo-settings/utils";
import {
  createSchemaProfileAPI,
  updateSchemaProfileAPI,
} from "../../../../store/schemaSlice";
import { getErrorsObject } from "../../../../store/utils";
import { setKeyValue } from "../../../../store/schemaSlice";

const AddSchemaPopup = (props) => {
  const dispatch = useDispatch();
  const { isOpen, onClose, editedItem, setEditedItem } = props;

  const [errors, setErrors] = useState({});
  const [schemaName, setSchemaName] = useState("");
  const [selectedValues, setSelectedValues] = useState({
    Product: ["name"],
    Offer: ["price"],
  });

  useEffect(() => {
    if (editedItem) {
      setSchemaName(editedItem?.name);
      setSelectedValues(editedItem?.schema);
    }
  }, [editedItem]);

  const handleOnSelectionChange = (value) => {
    setSelectedValues(value);
  };

  const handleAddOrUpdateSchema = async () => {
    const data = {
      name: schemaName,
      is_default: editedItem?.is_default || false,
      schema: selectedValues,
    };
    if (!schemaName) {
      setErrors({ name: "Schema name cannot be empty" });
      return;
    }
    let result;
    if (editedItem) {
      result = await updateSchemaProfileAPI(editedItem?.id, data);
    } else {
      result = await createSchemaProfileAPI(data);
    }
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      setEditedItem(null);
      onClose();
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };

  const buttonState =
    schemaName === "" || Object.values(selectedValues)?.length <= 0;

  return (
    <Popover isOpen={isOpen} onClose={onClose}>
      <PopoverHeader
        style={{ padding: "var(--decom-spacing-5)" }}
        onClose={onClose}
      >
        {editedItem
          ? __("Update schema profile", "kirki-ecommerce")
          : __("Create schema profile", "kirki-ecommerce")}
      </PopoverHeader>
      <PopoverBody
        style={{
          padding:
            "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)",
        }}
      >
        <Flex direction="column" gap={16}>
          <Input
            label={__("Schema preset name", "kirki-ecommerce")}
            placeholder={__("e.g General", "kirki-ecommerce")}
            value={schemaName}
            onChange={(value) => {
              setSchemaName(value);
              setErrors({ name: "" });
            }}
            error={errors["name"]}
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
        </Flex>
      </PopoverBody>
      <PopoverFooter style={{ justifyContent: "space-between" }}>
        <Text
          type="secondary"
          header={sprintf(
            __("%d selected", "kirki-ecommerce"),
            Object.keys(selectedValues)?.length
          )}
        />
        <ActionGroup>
          <Button
            text={__("Cancel", "kirki-ecommerce")}
            type="outlined"
            size="small"
            onClick={onClose}
          />
          <Button
            text={__("Save schema", "kirki-ecommerce")}
            type="primary"
            size="small"
            onClick={handleAddOrUpdateSchema}
            state={buttonState ? "disabled" : "default"}
          />
        </ActionGroup>
      </PopoverFooter>
    </Popover>
  );
};

export default AddSchemaPopup;
