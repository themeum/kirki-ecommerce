import {
  ActionGroup,
  Button,
  Checkbox,
  TableCell,
  TableRow,
  Thumbnail,
} from "@/molecules";
import React, { useState } from "react";
import CategoryAddEditPopover from "../CategoryAddEditPopover";
import { EditPenIcon, TrashIcon } from "@/Icons";
import {
  deleteCategoryByIdAPI,
  setKeyValue,
} from "../../../store/categoriesSlice";
import { useDispatch } from "react-redux";
import { __ } from "@/wpi18n";

const SingleRow = ({ item, isSelected, handleSingleCheckboxClick }) => {
  const [openPopup, setOpenPopup] = useState(false);
  const dispatch = useDispatch();

  const onItemDelete = async (id) => {
    const result = await deleteCategoryByIdAPI(id);
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
        <TableCell>{item?.name || "--"}</TableCell>
        <TableCell>
          <Thumbnail
            src={item?.image?.url}
            style={{ height: "48px", width: "48px" }}
          />
        </TableCell>
        <TableCell style={{ minWidth: "200px" }}>
          {item?.description || "--"}
        </TableCell>
        <TableCell>{item?.slug || "--"}</TableCell>
        <TableCell>{item?.count || 0}</TableCell>
        <TableCell alignment="right" style={{ width: "135px" }}>
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
        <CategoryAddEditPopover
          category={item}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

export default SingleRow;
