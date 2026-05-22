import { CloseIcon, ListFilter } from "@/Icons";
import {
  ActionGroup,
  Button,
  DropdownMenuContent,
  Flex,
  RadioGroup,
  Select,
  Text,
} from "@/molecules";
import React from "react";
import { useState } from "react";
import { useRef } from "react";
import { __, sprintf } from "@/wpi18n";
import { useDispatch, useSelector } from "react-redux";
import { setKeyValue } from "../../../../store/productsSlice";
import BrandFilter from "./BrandFilter";
import CollectionFilter from "./CollectionFilter";
import { useEffect } from "react";
import CategoriesFilter from "./CategoriesFilter";

const FilterPopup = ({ onChange = () => {}, buttonProps, data }) => {
  const dispatch = useDispatch();
  const popoverRef = useRef(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [filterObject, setFilterObject] = useState({});
  const { loaded, filter: filterData } = useSelector((state) => state.products);
  const hasFilter = Object.keys(filterData).length;

  useEffect(() => {
    // this is for initial data format [comma-separated string --> array]
    const { category_ids } = filterData;

    if (category_ids) {
      const idArray = category_ids?.split(",").map(Number);
      setFilterObject({ ...filterData, category_ids: idArray });
    } else setFilterObject(filterData);
  }, [loaded, filterData, openPopup]);

  const handleOnFilterChange = (val, filterName) => {
    setFilterObject((prev) => ({
      ...prev,
      [filterName]: val,
    }));
  };

  const handleOnApplyFilter = () => {
    let formattedData = { ...filterObject };
    Object.keys(filterObject).forEach((key) => {
      if (
        formattedData[key] === "all" ||
        formattedData[key] === "none" ||
        formattedData[key]?.length === 0
      ) {
        delete formattedData[key];
      }
    });
    if (filterObject?.category_ids) {
      if (filterObject?.category_ids.length > 0)
        formattedData.category_ids = filterObject?.category_ids.join(",");
    }

    dispatch(setKeyValue({ key: "filter", value: formattedData }));
    handleFilterClose();
  };

  const handleFilterClose = () => {
    setFilterObject({});
    setOpenPopup(false);
  };
  return (
    <>
      <Flex>
        <Button
          type="outlined"
          size="small"
          text={__("Filter", "kirki-ecommerce")}
          leftIcon={<ListFilter />}
          style={{
            borderRightColor: hasFilter ? "none" : "var(--decom-border-border)",
            borderRadius: hasFilter
              ? "var(--decom-radius-rounded-md) var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-md)"
              : "var(--decom-radius-rounded-md)",
          }}
          onClick={() => setOpenPopup((prev) => !prev)}
          ref={popoverRef}
          {...buttonProps}
        />
        {Object.keys(filterData).length ? (
          <Button
            type="outlined"
            size="small"
            style={{
              color: "var(--decom-text-text-emphasis)",
              backgroundColor: "var(--decom-background-bg-fill-secondary)",
              borderLeft: "none",
              cursor: "default",
              borderRadius:
                "var(--decom-radius-rounded-none) var(--decom-radius-rounded-md) var(--decom-radius-rounded-md) var(--decom-radius-rounded-none)",
            }}
            text={sprintf(__("%d", "kirki-ecommerce"), Object.keys(filterData).length)}
          />
        ) : null}
      </Flex>
      <DropdownMenuContent
        isOpen={openPopup}
        triggerRef={popoverRef}
        onClose={handleFilterClose}
        style={{ width: "288px", maxHeight: "522px" }}
      >
        <Flex
          style={{
            top: "-4px",
            position: "sticky",
            backgroundColor: "white",
            padding: "12px 12px 8px 12px",
            zIndex: "100",
          }}
        >
          <Text header={__("Filter", "kirki-ecommerce")} />
          <ActionGroup>
            <Button
              icon={<CloseIcon />}
              type="blank"
              onClick={handleFilterClose}
              style={{ color: "var(--decom-text-text-primary)" }}
            />
          </ActionGroup>
        </Flex>

        <Flex
          direction="column"
          gap={16}
          style={{
            padding: "8px 12px",
            overflowY: "auto",
            minHeight: "400px",
          }}
        >
          <CategoriesFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, "category_ids")}
          />
          <RadioGroup
            optionsArray={[
              { value: "published", title: __("Published", "kirki-ecommerce") },
              { value: "draft", title: __("Draft", "kirki-ecommerce") },
              { value: "all", title: __("All", "kirki-ecommerce") },
            ]}
            defaultValue="all"
            value={filterObject?.status || "all"}
            onChange={(val) => handleOnFilterChange(val, "status")}
            label={__("Status", "kirki-ecommerce")}
          />
          <Select
            label={__("Inventory", "kirki-ecommerce")}
            value={filterObject?.inventory_type}
            defaultValue="true"
            optionsArray={[
              { value: "in_stock", title: __("In stock", "kirki-ecommerce") },
              { value: "out_of_stock", title: __("Out of stock", "kirki-ecommerce") },
            ]}
            onChange={(val) => handleOnFilterChange(val, "inventory_type")}
          />
          <CollectionFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, "collection_id")}
          />
          <BrandFilter
            filterObject={filterObject}
            onChange={(val) => handleOnFilterChange(val, "brand_id")}
          />
        </Flex>

        <Flex
          style={{
            padding: "8px 12px 12px 12px",
            borderTop: "1px solid #E4E3E9",
            bottom: "-4px",
            position: "sticky",
            backgroundColor: "white",
          }}
        >
          <ActionGroup>
            <Button
              type="primary"
              text={__("Apply Filter", "kirki-ecommerce")}
              size="small"
              onClick={handleOnApplyFilter}
            />
          </ActionGroup>
        </Flex>
      </DropdownMenuContent>
    </>
  );
};

export default FilterPopup;
