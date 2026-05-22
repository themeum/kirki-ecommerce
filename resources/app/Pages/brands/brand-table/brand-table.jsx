import { ArrowDownUpFilled } from "@/icons";
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Table from '@/molecules/table/table';
import TableBody from '@/molecules/table/table-body';
import TableHead from '@/molecules/table/table-head';
import TableHeader from '@/molecules/table/table-header';
import TableRow from '@/molecules/table/table-row';
import React from "react";
import BrandTableAction from './brand-table-action';
import { useDispatch, useSelector } from "react-redux";
import BulkActionHandler from '@/components/bulk-action-handler';
import Sorting from '@/components/sorting';
import SingleRow from './single-row';
import { __ } from "@/wpi18n";
import { useMarkList } from "@/hooks";
import { deleteBrandsAPI, setKeyValue } from "../../../store/brandsSlice";

const BrandTable = () => {
  const tableHeaders = [
    {
      title: __("Name", "kirki-ecommerce"),
      sortable: {
        sort_by: "name",
        reducer: "brands",
        setKeyValue: setKeyValue,
      },
    },
    { title: __("Image", "kirki-ecommerce") },
    {
      title: __("Description", "kirki-ecommerce"),
      sortable: {
        sort_by: "description",
        reducer: "brands",
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __("Slug", "kirki-ecommerce"),
      sortable: {
        sort_by: "slug",
        reducer: "brands",
        setKeyValue: setKeyValue,
      },
    },
    {
      title: __("Count", "kirki-ecommerce"),
      sortable: {
        sort_by: "count",
        reducer: "brands",
        setKeyValue: setKeyValue,
      },
    },
  ];
  const dispatch = useDispatch();
  const data = useSelector((state) => state.brands?.data);
  const { results, total, per_page } = data;

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
        result = await deleteBrandsAPI({
          action: "delete-all",
          ids: null,
        });
      } else {
        result = await deleteBrandsAPI({
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
        <BrandTableAction />
      )}
      <Table type="variation">
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox style={{ padding: "20px 12px" }}>
              <Checkbox
                value={isSelected("*")}
                onChange={handleAllCheckboxClick}
                isPartialChecked={itemCount > 0 && itemCount < total}
              />
            </TableHead>
            {tableHeaders.map((header, index) => (
              <TableHead key={index} style={{ padding: "20px 12px" }}>
                <Sorting data={header} />
              </TableHead>
            ))}
            <TableHead></TableHead>
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

export default BrandTable;
