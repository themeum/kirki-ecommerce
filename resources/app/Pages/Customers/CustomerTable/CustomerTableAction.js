import { ArrowDownUp, ListFilter } from "@/Icons";
import { ActionGroup, Button, Flex, Searchbox, Select } from "@/molecules";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setKeyValue } from "../../../store/customersSlice";
import { __ } from "@/wpi18n";

const CustomerTableAction = () => {
  const selectOptions = [
    { value: "all", title: __("All Customers", "kirki-ecommerce") },
    { value: "new", title: __("New Customers", "kirki-ecommerce") },
    { value: "top", title: __("Top Customers", "kirki-ecommerce") },
  ];
  const dispatch = useDispatch();
  const { search, sort_order } = useSelector((state) => state.customers);

  const handleSearchChange = (value) => {
    dispatch(setKeyValue({ key: "search", value: value }));
  };

  const handleSortChange = () => {
    if (sort_order === "asc") {
      dispatch(setKeyValue({ key: "sort_order", value: "desc" }));
    } else {
      dispatch(setKeyValue({ key: "sort_order", value: "asc" }));
    }
  };

  return (
    <Flex style={{ padding: "16px 12px" }}>
      <div style={{ width: "180px" }}>
        <Searchbox
          value={search}
          onChange={(value) => handleSearchChange(value)}
        />
      </div>
      <ActionGroup>
        <Select
          placeholder="Date: This Month"
          style={{ padding: "8px 16px" }}
        />
        <Button
          type="outlined"
          size="small"
          text="Filter"
          leftIcon={<ListFilter />}
        />
        <Button
          type="outlined"
          size="small"
          icon={<ArrowDownUp />}
          onClick={handleSortChange}
        />
      </ActionGroup>
    </Flex>
  );
};

export default CustomerTableAction;
