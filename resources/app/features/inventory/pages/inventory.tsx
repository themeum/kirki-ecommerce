import { useEffect } from 'react';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { useUpdateBulkVariantsMutation } from '@/features/bulk-edit';
import { InventoryFormProvider, useInventoryForm } from '@/features/inventory';
import InventoryTable from '@/features/inventory/pages/inventory-table/inventory-table';
import { useInventoryQuery } from '@/features/inventory/services/inventory';
import { inventoryListOptions } from '@/features/inventory/types';
import { useDataTableParams } from '@/hooks';
import { __ } from '@/wpi18n';

const InventoryPage = () => {
  const { params } = useDataTableParams(inventoryListOptions);
  const { data: inventoryData } = useInventoryQuery(params);
  const { setInventory, data, hasChanges, resetChanges } = useInventoryForm();
  const { mutate: updateBulkVariants } = useUpdateBulkVariantsMutation();

  useEffect(() => {
    if (inventoryData) {
      setInventory(inventoryData);
    }
  }, [inventoryData, setInventory]);

  const handleInventoryUpdate = () => {
    if (!data) {
      return;
    }
    updateBulkVariants(
      { variants: Object.values(data.results) },
      { onSuccess: () => resetChanges() },
    );
  };

  const handleDiscardUpdate = () => {
    if (inventoryData) {
      setInventory(inventoryData);
    }
    resetChanges();
  };

  return (
    <>
      <PageHeading
        text={
          hasChanges
            ? __('Save changes?', 'kirki-ecommerce')
            : __('Inventory', 'kirki-ecommerce')
        }
        actions={
          hasChanges ? (
            <>
              <Button
                variant="ghost"
                onClick={handleDiscardUpdate}
              >
                {__('Discard', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={handleInventoryUpdate}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost">
                {__('Import', 'kirki-ecommerce')}
              </Button>
              <Button variant="ghost">
                {__('Export', 'kirki-ecommerce')}
              </Button>
            </>
          )
        }
      />
      <Container>
        <InventoryTable />
      </Container>
    </>
  );
};

InventoryPage.displayName = 'InventoryPage';

const Inventory = () => (
  <InventoryFormProvider>
    <InventoryPage />
  </InventoryFormProvider>
);

Inventory.displayName = 'Inventory';

export default Inventory;

