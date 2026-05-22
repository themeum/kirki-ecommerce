import Checkbox from '@/molecules/checkbox';
import Table from '@/molecules/table/table';
import TableBody from '@/molecules/table/table-body';
import TableHead from '@/molecules/table/table-head';
import TableHeader from '@/molecules/table/table-header';
import TableRow from '@/molecules/table/table-row';
import React from "react";
import CollectionTableAction from './collection-table-action';
import { useSelector } from "react-redux";
import { useMarkList } from "@/hooks";
import SingleRow from './single-row';
import BulkActionHandler from '@/components/bulk-action-handler';
import { __ } from "@/wpi18n";

const CollectionTable = () => {
  const data = useSelector((state) => state.collections?.data);
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

  const tableHeaders = [
    { title: __("Collection", "kirki-ecommerce") },
    { title: __("Products", "kirki-ecommerce") },
    { title: __("Created at", "kirki-ecommerce") },
    { title: __("", "kirki-ecommerce") },
  ];

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
        <CollectionTableAction />
      )}

      <Table fixed>
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
              <TableHead key={index}>{header.title}</TableHead>
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

export default CollectionTable;
