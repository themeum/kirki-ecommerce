import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "molecules/table";
import { Checkbox } from "molecules";
import SingleRow from "./SingleRow";
import { useMarkList } from "hooks";
import { useDispatch, useSelector } from "react-redux";
import { BulkActionHandler, Sorting } from "components";
import CustomerTableAction from "./CustomerTableAction";
import { __ } from "wpi18n";
import { deleteCustomersAPI, setKeyValue } from "../../../store/customersSlice";

const CustomerTable = () => {
  const data = useSelector((state) => state.customers?.data);
  const dispatch = useDispatch();
  const { results, total, per_page } = data;
  const tableHeaders = [
    {
      title: __("Customer", "kirki-ecommerce"),
      sortable: {
        sort_by: "first_name",
        reducer: "customers",
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __("Orders", "kirki-ecommerce"),
    },
    {
      title: __("Amount Spent", "kirki-ecommerce"),
    },
    {
      title: __("Location", "kirki-ecommerce"),
    },
    {
      title: __("Last Order", "kirki-ecommerce"),
    },
    {
      title: __("Joined at", "kirki-ecommerce"),
    },
    {
      title: __("", "kirki-ecommerce"),
    },
  ];
  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data });

  const handleApplyAction = async (action) => {
    if (action === "delete") {
      let result = {};
      if (selectedItems.includes("*")) {
        result = await deleteCustomersAPI({
          action: "delete-all",
          ids: null,
        });
      } else {
        result = await deleteCustomersAPI({
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
          optionsArray={[{ value: "delete", title: __("Delete", "kirki-ecommerce") }]}
          itemCount={itemCount}
          onSelectAll={handleSelectAll}
          onApply={(action) => handleApplyAction(action)}
          total={total}
          per_page={per_page}
        />
      ) : (
        <CustomerTableAction />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox>
              <Checkbox
                value={isSelected("*")}
                onChange={handleAllCheckboxClick}
                isPartialChecked={itemCount > 0 && itemCount < total}
              />
            </TableHead>
            {tableHeaders.map((header, index) => (
              <TableHead key={index}>
                <Sorting data={header} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((item, index) => (
            <SingleRow
              key={index}
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

export default CustomerTable;
