import { Page, PageContent, PageHeading } from '@/components/ui/page';
import InventoryTable from '@/features/inventory/components/inventory-table/inventory-table';
import { __ } from '@/wpi18n';

const Inventory = () => (
  <Page>
    <PageHeading text={__('Inventory', 'kirki-ecommerce')} />
    <PageContent>
      <InventoryTable />
    </PageContent>
  </Page>
);

Inventory.displayName = 'Inventory';

export default Inventory;
