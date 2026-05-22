import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Table from '@/molecules/table/table';
import TableBody from '@/molecules/table/table-body';
import TableHead from '@/molecules/table/table-head';
import TableHeader from '@/molecules/table/table-header';
import TableRow from '@/molecules/table/table-row';
import React from "react";
import { useSelector } from "react-redux";
import { useMarkList } from "@/hooks";
import BulkActionHandler from '@/components/bulk-action-handler';
import { __ } from "@/wpi18n";
import SingleRow from './single-row';
import InventoryTableAction from './inventory-table-action';
import { useNavigate } from "react-router";
import { useState } from "react";
import { allTableHeaders } from "../utils";

const InventoryTable = () => {
  const navigate = useNavigate();
  const { data } = useSelector((state) => state.inventory);
  const { results, per_page } = data;
  const [selectedFields, setSelectedFields] = useState(
    allTableHeaders.map((item) => item.value),
  );

  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    selectedItems,
    itemCount,
  } = useMarkList({
    data: {
      results: Object.values(results),
      total: Object.values(results).length,
    },
  });

  const handleApplyAction = () => {
    navigate(`/variants/bulk?ids=${selectedItems.join(",")}`);
  };
  return (
    <>
      {selectedItems.length > 0 ? (
        <Flex gap={8} style={{ alignItems: "center", height: "68px" }}>
          <BulkActionHandler
            itemCount={itemCount}
            onSelectAll={() => handleAllCheckboxClick(true)}
            total={Object.values(results).length}
            per_page={per_page}
          />
          <Button
            type="secondary"
            text={__("Bulk Edit", "kirki-ecommerce")}
            onClick={handleApplyAction}
            size="small"
          />
        </Flex>
      ) : (
        <InventoryTableAction
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
        />
      )}

      <Table editMode="singleCell">
        <TableHeader>
          <TableRow>
            <TableHead onlyCheckbox>
              <Checkbox
                value={isSelected("*")}
                onChange={handleAllCheckboxClick}
                isPartialChecked={
                  itemCount > 0 && itemCount < Object.keys(results).length
                }
              />
            </TableHead>
            {allTableHeaders
              .filter((item) => selectedFields.includes(item?.value))
              .map((header, index) => (
                <TableHead alignment={header?.alignment} key={index}>
                  {header.title}
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.values(results).map((item, index) => (
            <SingleRow
              key={index}
              item={item}
              isSelected={isSelected}
              handleSingleCheckboxClick={handleSingleCheckboxClick}
              selectedFields={selectedFields}
            />
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default InventoryTable;
