import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "molecules/table";
import { Checkbox } from "molecules";
import { useDispatch, useSelector } from "react-redux";
import ProductTableAction from "./ProductTableAction";
import { __ } from "wpi18n";
import { deleteProductsAPI, setKeyValue } from "../../../store/productsSlice";
import { useMarkList } from "hooks";
import { BulkActionHandler } from "components";
import SingleRow from "./SingleRow";
import FilterPopup from "./FilterPopup";
import ProductTableFilterAction from "./ProductTableFilterAction";
import { useEffect } from "react";

const ProductTable = () => {
  const tableHeaders = [
    { title: __("Product", "kirki-ecommerce") },
    { title: __("SKU", "kirki-ecommerce") },
    { title: __("Inventory", "kirki-ecommerce") },
    { title: __("Price", "kirki-ecommerce") },
    { title: __("Status", "kirki-ecommerce") },
    { title: __("Date", "kirki-ecommerce") },
  ];

  const dispatch = useDispatch();
  const data = useSelector((state) => state.products?.data);
  const filterData = useSelector((state) => state.products?.filter);
  const { results, total, per_page } = data;

  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    isPartiallySelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data });

  useEffect(() => {
    handleClearSelection();
  }, [filterData]);

  const handleApplyAction = async (action) => {
    if (action === "delete") {
      let result = {};
      if (selectedItems.includes("*")) {
        result = await deleteProductsAPI({
          action: "delete-all",
          ids: null,
        });
      } else {
        result = await deleteProductsAPI({
          action: "delete",
          ids: selectedItems,
        });
      }

      if (result.success) {
        dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
        handleClearSelection();
      } else {
        console.log(result);
      }
    }
  };

  return (
    <>
      {selectedItems.length > 0 ? (
        <BulkActionHandler
          optionsArray={[{ value: "trash", title: __("Trash", "kirki-ecommerce") }]}
          itemCount={itemCount}
          onSelectAll={
            itemCount === total ? handleClearSelection : handleSelectAll
          }
          onApply={(action) => handleApplyAction(action)}
          filterAction={<FilterPopup />}
          total={total}
          per_page={per_page}
        />
      ) : (
        <ProductTableAction />
      )}
      {Object.keys(filterData).length > 0 ? <ProductTableFilterAction /> : null}

      <Table fixed>
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox>
              <Checkbox
                value={isSelected("*")}
                onChange={handleAllCheckboxClick}
                isPartialChecked={isPartiallySelected("*")}
              />
            </TableHead>
            {tableHeaders.map((header, index) => (
              <TableHead key={index}>{header.title}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((item, index) => (
            <SingleRow
              key={item?.id}
              item={item}
              isSelected={isSelected}
              handleSingleCheckboxClick={handleSingleCheckboxClick}
            />
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default ProductTable;
