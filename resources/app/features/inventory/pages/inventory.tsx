import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import InventoryTable from '@/features/inventory/components/inventory-table/inventory-table';
import { __ } from '@/wpi18n';

const Inventory = () => (
  <>
    <PageHeading
      text={__('Inventory', 'kirki-ecommerce')}
      actions={
        <>
          <Button variant="ghost">{__('Import', 'kirki-ecommerce')}</Button>
          <Button variant="ghost">{__('Export', 'kirki-ecommerce')}</Button>
        </>
      }
    />
    <Container>
      <InventoryTable />
    </Container>
  </>
);

Inventory.displayName = 'Inventory';

export default Inventory;
