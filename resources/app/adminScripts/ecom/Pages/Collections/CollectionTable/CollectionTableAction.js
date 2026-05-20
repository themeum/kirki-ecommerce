import { ArrowDownUp } from "icons";
import { ActionGroup, Button, Flex, Searchbox, Select } from "molecules";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setKeyValue } from "../../../store/collectionsSlice";
import { __ } from "wpi18n";

const selectOptions = [
  { value: "all", title: __("All Collections", "kirki-ecommerce") },
  { value: "new", title: __("New Collections", "kirki-ecommerce") },
  { value: "top", title: __("Top Collections", "kirki-ecommerce") },
];
const CollectionTableAction = () => {
  const dispatch = useDispatch();
  const { search, sort_order } = useSelector((state) => state.collections);

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
          placeholder={__("Date: This Month", "kirki-ecommerce")}
          style={{ padding: "8px 16px" }}
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

export default CollectionTableAction;
