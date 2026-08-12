import { useState } from 'react';
import { useNavigate } from 'react-router';

import BulkActionHandler from '@/components/bulk-action-handler';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RouteConfig } from '@/config/route-config';
import { useInventoryForm } from '@/contexts/inventory-form-context';
import { useMarkList } from '@/hooks';
import InventoryTableAction from '@/pages/inventory/inventory-table/inventory-table-action';
import SingleRow from '@/pages/inventory/inventory-table/single-row';
import { allTableHeaders } from '@/pages/inventory/utils';
import type { InventoryVariant } from '@/types';
import { __ } from '@/wpi18n';

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
    void navigate(`${RouteConfig.BulkVariants.buildLink()}?ids=${selectedItems.join(',')}`);
  };

  return (
    <>
      {selectedItems.length > 0 ? (
        <Flex gap={2} align="center" cssOverride={{ height: '68px' }}>
          <BulkActionHandler
            itemCount={itemCount}
            onSelectAll={() => handleAllCheckboxClick(true)}
            total={Object.values(results).length}
            per_page={per_page}
          />
          <Button
            variant="secondary"
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
