import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { RouteConfig } from '@/config/route-config';
import InventoryTable from '@/features/inventory/components/inventory-table/inventory-table';
import { useInventoryQuery } from '@/features/inventory/services/inventory';
import { inventoryListOptions } from '@/features/inventory/types';
import { useDataTableParams } from '@/hooks';
import { InventoryEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Inventory = () => {
  const navigate = useNavigate();
  const { params } = useDataTableParams(inventoryListOptions);

  const { data, isFetching } = useInventoryQuery(params);

  const hasRecord = data?.has_records !== false;

  return (
    <Page>
      <PageHeading text={__('Inventory', 'kirki-ecommerce')} />
      <PageContent>
        {!hasRecord ? (
          <NotFoundState
            icon={<InventoryEmptyStateIcon />}
            text={__('Track your inventory', 'kirki-ecommerce')}
            description={__(
              'Add products to monitor stock levels and keep every order running smoothly.',
              'kirki-ecommerce',
            )}
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  void navigate(RouteConfig.Products.get('CreateProduct').buildLink());
                }}
              >
                {__('Add Product', 'kirki-ecommerce')}
              </Button>
            }
          />
        ) : (
          <InventoryTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

Inventory.displayName = 'Inventory';

export default Inventory;
