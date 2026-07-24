import { useEffect } from 'react';

import Pagination from '@/components/pagination';
import Button from '@/components/ui/button';
import { InventoryFormProvider, useInventoryForm } from '@/contexts/inventory-form-context';
import { useListParams } from '@/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { cardStyles } from '@/theme/card-styles';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { useUpdateBulkVariantsMutation } from '@/services/bulk-edit';
import { useInventoryQuery } from '@/services/inventory';
import { __ } from '@/wpi18n';

import InventoryTable from '@/pages/inventory/inventory-table/inventory-table';

const InventoryPage = () => {
  const { params, setParam } = useListParams({
    defaults: { sort_by: 'id', sort_order: 'asc', page: 1, limit: 20 },
  });
  const { data: inventoryData, isLoading } = useInventoryQuery(params);
  const { setInventory, data, loaded, hasChanges, resetChanges } = useInventoryForm();
  const { mutate: updateBulkVariants } = useUpdateBulkVariantsMutation();

  useEffect(() => {
    if (inventoryData) {
      setInventory(inventoryData);
    }
  }, [inventoryData]);

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
        {loaded && !isLoading ? (
          <Flex direction="column" gap={16}>
            <Card css={cardStyles.tableCard}>
              <CardContent css={cardStyles.tableContent}>
                <InventoryTable />
              </CardContent>
            </Card>
            <Pagination
              data={{
                current_page: data?.current_page ?? 1,
                last_page: data?.last_page ?? 1,
                from: data?.from ?? 0,
                total: data?.total ?? 0,
                has_more_pages: data?.has_more_pages ?? false,
              }}
              onChange={(page) => setParam('page', page)}
            />
          </Flex>
        ) : (
          <div>{__('Loading...', 'kirki-ecommerce')}</div>
        )}
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

