import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import TableCell from '@/molecules/table/table-cell';
import TableRow from '@/molecules/table/table-row';
import Thumbnail from '@/molecules/thumbnail';
import React, { useState } from "react";
import CategoryAddEditPopover from "../category-add-edit-popover";
import { EditPenIcon, TrashIcon } from "@/icons";
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
