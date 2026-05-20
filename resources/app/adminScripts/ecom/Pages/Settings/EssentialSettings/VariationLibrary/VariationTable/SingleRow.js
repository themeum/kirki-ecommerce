import React, { useState } from "react";
import {
  TableRow,
  TableCell,
  Checkbox,
  ActionGroup,
  Button,
  Flex,
} from "../../../../../molecules";
import { __ } from "wpi18n";

import { EditPenIcon, TrashIcon } from "icons";
import {
  deleteAttributeValueByIdAPI,
  setKeyValue,
} from "../../../../../store/attributesSlice";
import VariationValuePopup from "../VariationValuePopup";
import { setUnsavedDataStatus } from "../../../utils";
import { useOutletContext } from "react-router";
import { dispatchToastMessage } from "../../../../utils";
import { useDispatch } from "react-redux";

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
  selectedItem,
}) => {
  const { confirmAction } = useOutletContext();
  const [editedItem, setEditedItem] = useState(null);
  const dispatch = useDispatch();

  const handleAttributeValueRemove = async () => {
    setUnsavedDataStatus(true);
    confirmAction({
      action: () => onDeleteValue(),
      otherProps: {
        variant: "delete",
        force: true,
        title: __("Delete attribute value?", "kirki-ecommerce"),
        subtitle: __(
          "Are you sure you want to delete this value? This action cannot be undone.",
          "kirki-ecommerce"
        ),
      },
    });
  };

  const onDeleteValue = async () => {
    const params = { attribute_id: selectedItem?.id, value_id: item?.id };
    const result = await deleteAttributeValueByIdAPI(params);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
    } else dispatchToastMessage("error", { title: "Something went wrong" });
  };

  return (
    <>
      <TableRow key={item.id}>
        <TableCell onlyCheckbox>
          <Checkbox
            value={isSelected(item.id)}
            onChange={(value) => handleSingleCheckboxClick(value, item.id)}
          />
        </TableCell>
        <TableCell>
          <Flex gap={12} style={{ alignItems: "center" }}>
            {selectedItem?.type === "color" && (
              <div
                style={{
                  height: "32px",
                  width: "32px",
                  minWidth: "32px",
                  borderRadius: "var(--decom-radius-rounded-md)",
                  border: "1.17px solid var(--decom-border-border) ",
                  background: `${item?.color}`,
                }}
              ></div>
            )}
            {item?.value}
          </Flex>
        </TableCell>

        {selectedItem?.type === "color" && <TableCell>{item?.color}</TableCell>}
        <TableCell>{selectedItem?.updated_at}</TableCell>
        <TableCell alignment="right" style={{ width: "1%" }}>
          <ActionGroup>
            <Button
              type="secondary"
              icon={<TrashIcon />}
              onClick={handleAttributeValueRemove}
              size="small"
            />
            <Button
              type="secondary"
              icon={<EditPenIcon />}
              onClick={() => setEditedItem(item)}
              size="small"
            />
          </ActionGroup>
        </TableCell>
      </TableRow>
      {editedItem && (
        <VariationValuePopup
          isOpen={editedItem}
          onClose={() => setEditedItem(null)}
          editedItem={editedItem}
          type={selectedItem?.type}
          selectedItem
        />
      )}
    </>
  );
};

export default SingleRow;
