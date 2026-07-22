import { useState } from 'react';
import { useNavigate } from 'react-router';

import BulkActionHandler from '@/components/bulk-action-handler';
import Button from '@/components/ui/button';
import { useInventoryForm } from '@/contexts/inventory-form-context';
import { useMarkList } from '@/hooks';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/molecules/table';
import type { InventoryVariant } from '@/types';
import { __ } from '@/wpi18n';

import { allTableHeaders } from '@/pages/inventory/utils';
import InventoryTableAction from '@/pages/inventory/inventory-table/inventory-table-action';
import SingleRow from '@/pages/inventory/inventory-table/single-row';

const InventoryTable = () => {
  const navigate = useNavigate();
  const { data } = useInventoryForm();
  const { results, per_page } = data!;
  const [selectedFields, setSelectedFields] = useState(
    allTableHeaders.map((item) => item.value),
  );

  const {
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
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
    navigate(`/variants/bulk?ids=${selectedItems.join(',')}`);
  };

  return (
    <>
      {selectedItems.length > 0 ? (
        <Flex gap={8} style={{ alignItems: 'center', height: '68px' }}>
          <BulkActionHandler
            itemCount={itemCount}
            onSelectAll={() => handleAllCheckboxClick(true)}
            total={Object.values(results).length}
            per_page={per_page}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleApplyAction}
          >
            {__('Bulk Edit', 'kirki-ecommerce')}
          </Button>
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
                value={isSelected('*')}
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
          {Object.values(results).map((item: InventoryVariant, index) => (
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

InventoryTable.displayName = 'InventoryTable';

export default InventoryTable;
