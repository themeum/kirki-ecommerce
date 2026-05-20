import { EditPenIcon, TrashIcon } from "icons";
import {
  ActionGroup,
  Button,
  Checkbox,
  Flex,
  TableCell,
  TableRow,
  Text,
  Thumbnail,
} from "molecules";
import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { __ } from "wpi18n";
import {
  deleteCustomerByIdAPI,
  setKeyValue,
} from "../../../store/customersSlice";

const SingleRow = ({ item, isSelected, handleSingleCheckboxClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleItemClick = (id) => {
    navigate("/customers/" + id);
  };

  const onItemDelete = async (id) => {
    const result = await deleteCustomerByIdAPI(id);
    if (result.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
    } else {
      console.log(result);
    }
  };
  return (
    <TableRow
      key={item.id}
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
          <Thumbnail src={item?.photo?.url} size="small" type="circle" />
          <Flex direction="column" gap={6}>
            <div>
              {item?.first_name} {item?.last_name}
            </div>
            <Text header={item?.email} type="xsm" emphasis />
          </Flex>
        </Flex>
      </TableCell>
      <TableCell>{item?.orders_count || "--"}</TableCell>
      <TableCell>{item?.amount_spent || "--"}</TableCell>
      <TableCell>{item?.location || "--"}</TableCell>
      <TableCell>{item?.last_order_date || "--"}</TableCell>
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
  );
};

export default SingleRow;
