import React from "react";
import Table from '@/molecules/table/table';
import TableBody from '@/molecules/table/table-body';
import TableHead from '@/molecules/table/table-head';
import TableHeader from '@/molecules/table/table-header';
import TableRow from '@/molecules/table/table-row';
import Checkbox from '@/molecules/checkbox';
import { useDispatch, useSelector } from "react-redux";
import ProductTableAction from './product-table-action';
import { __ } from "@/wpi18n";
import { deleteProductsAPI, setKeyValue } from "../../../store/productsSlice";
import { useMarkList } from "@/hooks";
import BulkActionHandler from '@/components/bulk-action-handler';
import SingleRow from './single-row';
import FilterPopup from './filter-popup/filter-popup';
import ProductTableFilterAction from './product-table-filter-action';
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
