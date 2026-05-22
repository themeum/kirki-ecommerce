import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import TableCell from '@/molecules/table/table-cell';
import TableRow from '@/molecules/table/table-row';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import React from "react";
import { EditPenIcon, TrashIcon } from "@/icons";
import {
  deleteCollectionByIdAPI,
  setKeyValue,
} from "../../../store/collectionsSlice";
import { useDispatch } from "react-redux";
import { __ } from "@/wpi18n";
import { useNavigate } from "react-router";

const SingleRow = ({ item, isSelected, handleSingleCheckboxClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleItemClick = (id) => {
    navigate("/collections/" + id);
  };

  const onItemDelete = async (id) => {
    const result = await deleteCollectionByIdAPI(id);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
    } else {
      console.log(result);
    }
  };
  return (
    <>
      <TableRow
        style={{ cursor: "pointer" }}
        onClick={() => handleItemClick(item.id)}
      >
        <TableCell onlyCheckbox>
          <Checkbox
            value={isSelected(item.id)}
            onChange={(value) => handleSingleCheckboxClick(value, item.id)}
          />
        </TableCell>
        <TableCell>
          <Flex gap={8} style={{ alignItems: "center" }}>
            <Thumbnail size="small" src={item?.banner?.url} />
            <Text type="xsm" header={item?.title || "--"} />
          </Flex>
        </TableCell>
        <TableCell>{item?.count || 0}</TableCell>
        <TableCell>{item?.created_at || "--"}</TableCell>
        <TableCell alignment="right">
          <ActionGroup>
            <Button
              size="small"
              text={__("Edit", "kirki-ecommerce")}
              type="secondary"
              leftIcon={<EditPenIcon />}
              onClick={() => {
                handleItemClick(item.id);
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
    </>
  );
};

export default SingleRow;
