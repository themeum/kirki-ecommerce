import { ActionGroup, Button, Checkbox, TableCell, TableRow } from "molecules";
import React, { useState } from "react";
import { EditPenIcon, TrashIcon } from "icons";
import { useDispatch } from "react-redux";
import TagAddEditPopover from "../TagAddEditPopover";
import { deleteTagByIdAPI, setKeyValue } from "../../../store/tagsSlice";
import { __ } from "wpi18n";

const SingleRow = ({ item, isSelected, handleSingleCheckboxClick }) => {
  const [openPopup, setOpenPopup] = useState(false);
  const dispatch = useDispatch();

  const onItemDelete = async (id) => {
    const result = await deleteTagByIdAPI(id);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
    } else {
      console.log(result);
    }
  };
  return (
    <>
      <TableRow
        key={item.id}
        onClick={() => setOpenPopup(true)}
        style={{ cursor: "pointer" }}
      >
        <TableCell onlyCheckbox>
          <Checkbox
            value={isSelected(item.id)}
            onChange={(value) => handleSingleCheckboxClick(value, item.id)}
          />
        </TableCell>
        <TableCell style={{ width: "20%" }}>{item?.name || "--"}</TableCell>
        <TableCell style={{ width: "30%" }}>
          {item?.description || "--"}
        </TableCell>
        <TableCell>{item?.slug || "--"}</TableCell>
        <TableCell>{item?.count || 0}</TableCell>
        <TableCell alignment="right" style={{ width: "1%" }}>
          <ActionGroup>
            <Button
              size="small"
              text={__("Edit", "kirki-ecommerce")}
              type="secondary"
              leftIcon={<EditPenIcon />}
              onClick={() => {
                setOpenPopup(true);
              }}
            />
            <Button
              size="small"
              type="destructiveSoft"
              icon={<TrashIcon />}
              onClick={() => {
                onItemDelete(item.id);
              }}
            />
          </ActionGroup>
        </TableCell>
      </TableRow>
      {openPopup && (
        <TagAddEditPopover tag={item} onClose={() => setOpenPopup(false)} />
      )}
    </>
  );
};

export default SingleRow;
