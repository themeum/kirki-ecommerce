import { ArrowDownUp } from "@/Icons";
import { ActionGroup, Button, Flex, Searchbox, Select } from "@/molecules";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import { setKeyValue } from "../../../store/productsSlice";
import FilterPopup from "./FilterPopup";

const ProductTableAction = () => {
  const dispatch = useDispatch();
  const { search, sort_order } = useSelector((state) => state.products);

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
      <div style={{ width: "160px" }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value)}
          value={search}
        />
      </div>
      <ActionGroup>
        <Select
          placeholder={__("Date: This Month", "kirki-ecommerce")}
          style={{ padding: "8px 16px" }}
          size="small"
        />
        <FilterPopup />
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

export default ProductTableAction;
