import { LayoutIcon, ListFilter } from "@/icons";
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setKeyValue } from "../../../store/inventorySlice";
import DropdownButton from '@/components/dropdown-button';
import { __ } from "@/wpi18n";
import { allTableHeaders } from "../utils";
import { Select } from '@/molecules/select';

const InventoryTableAction = ({ selectedFields, setSelectedFields }) => {
  const dispatch = useDispatch();
  const { search } = useSelector((state) => state.inventory);

  const handleSearchChange = (value) => {
    dispatch(setKeyValue({ key: "search", value: value }));
  };

  return (
    <Flex style={{ padding: "16px 12px" }}>
      <div style={{ width: "180px" }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value)}
          value={search}
          placeholder={__("Search Products", "kirki-ecommerce")}
        />
      </div>

      <ActionGroup>
        <Select
          placeholder={__("Date: This Month", "kirki-ecommerce")}
          style={{ padding: "8px 16px" }}
        />
        <Button
          type="outlined"
          size="small"
          text={__("Filter", "kirki-ecommerce")}
          leftIcon={<ListFilter />}
        />
        <DropdownButton
          buttonProps={{
            type: "outlined",
            size: "small",
            icon: <LayoutIcon />,
          }}
          options={allTableHeaders}
          value={selectedFields}
          hasLeftIcon
          checkboxField
          multiple
          dropdownStyle={{ minWidth: "288px" }}
          onOptionSelect={(value) => setSelectedFields(value)}
        />
      </ActionGroup>
    </Flex>
  );
};

export default InventoryTableAction;
