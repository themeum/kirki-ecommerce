import Badge from '@/molecules/badge';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import TableCell from '@/molecules/table/table-cell';
import TableRow from '@/molecules/table/table-row';
import Thumbnail from '@/molecules/thumbnail';
import React from "react";
import { useNavigate } from "react-router";

const SingleRow = (props) => {
  const { item, isSelected, handleSingleCheckboxClick } = props;
  const navigate = useNavigate();
  const handleItemClick = (id) => {
    navigate("/products/" + id);
  };
  return (
    <TableRow key={item.id}>
      <TableCell onlyCheckbox>
        <Checkbox
          value={isSelected(item.id)}
          onChange={(value) => handleSingleCheckboxClick(value, item.id)}
        />
      </TableCell>
      <TableCell>
        <Flex gap={12} style={{ alignItems: "center" }}>
          <Thumbnail src={item?.image} size="small" />
          <span
            style={{ cursor: "pointer" }}
            onClick={() => {
              handleItemClick(item.id);
            }}
          >
            <span style={{ color: "#878593" }}>{item?.title} </span>
          </span>
        </Flex>
      </TableCell>
      <TableCell>{item?.sku || 1236127}</TableCell>
      <TableCell>{item?.inventory}</TableCell>
      <TableCell>{item?.price}</TableCell>
      <TableCell>
        <Badge text={item?.status} type={item?.status} />
      </TableCell>
      <TableCell>{item?.created_at}</TableCell>
    </TableRow>
  );
};

export default SingleRow;
