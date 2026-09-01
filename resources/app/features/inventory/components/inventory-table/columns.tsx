import type { ColumnDef } from '@tanstack/react-table';

import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import { useInventoryForm } from '@/features/inventory';
import type { InventoryVariant } from '@/features/products';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { calculateProfit } from '@/utils/common';
import { __ } from '@/wpi18n';

const styles = defineStyles({
  productCell: {
    minWidth: '208px',
    padding: `7px ${theme.spacing[3]}`,
  },
  inputCell: {
    padding: theme.spacing[0],
  },
  profitCell: {
    padding: theme.spacing[0],
    pointerEvents: 'none',
  },
  tableInput: {
    ...theme.typography.small(),
  },
});

const InventoryTitleCell = ({ item }: { item: InventoryVariant }) => (
  <Flex gap={3} align="center">
    <Image src={item?.product?.image} size="sm" />
    <Flex direction="column" gap={1}>
      <Text variant="tiny">{item?.product?.name}</Text>
      <Text variant="tiny" color="muted">
        {item?.name}
      </Text>
    </Flex>
  </Flex>
);

InventoryTitleCell.displayName = 'InventoryTitleCell';

const InventorySkuCell = ({ item }: { item: InventoryVariant }) => {
  const { updateInventory } = useInventoryForm();

  return (
    <Input
      value={item?.sku ?? undefined}
      placeholder="--"
      invisible
      cssOverride={styles.tableInput}
      onChange={(event) => updateInventory({ id: item.id, changes: { sku: event.target.value } })}
    />
  );
};

InventorySkuCell.displayName = 'InventorySkuCell';

const InventoryPriceCell = ({ item }: { item: InventoryVariant }) => {
  const { updateInventory } = useInventoryForm();

  return (
    <Input
      value={item?.base_price ?? undefined}
      placeholder="--"
      invisible
      cssOverride={styles.tableInput}
      onChange={(event) =>
        updateInventory({ id: item.id, changes: { base_price: event.target.value } })
      }
    />
  );
};

InventoryPriceCell.displayName = 'InventoryPriceCell';

const InventorySalePriceCell = ({ item }: { item: InventoryVariant }) => {
  const { updateInventory } = useInventoryForm();

  return (
    <Input
      value={item?.base_sale_price ?? undefined}
      placeholder="--"
      invisible
      cssOverride={styles.tableInput}
      onChange={(event) =>
        updateInventory({ id: item.id, changes: { base_sale_price: event.target.value } })
      }
    />
  );
};

InventorySalePriceCell.displayName = 'InventorySalePriceCell';

const InventoryCostOfGoodsCell = ({ item }: { item: InventoryVariant }) => {
  const { updateInventory } = useInventoryForm();

  return (
    <Input
      value={item?.base_cost_of_goods ?? undefined}
      placeholder="--"
      invisible
      cssOverride={styles.tableInput}
      onChange={(event) =>
        updateInventory({ id: item.id, changes: { base_cost_of_goods: event.target.value } })
      }
    />
  );
};

InventoryCostOfGoodsCell.displayName = 'InventoryCostOfGoodsCell';

const InventoryProfitCell = ({ item }: { item: InventoryVariant }) => (
  <Input
    value={calculateProfit('profit', item)}
    placeholder="--"
    readOnly
    invisible
    cssOverride={styles.tableInput}
  />
);

InventoryProfitCell.displayName = 'InventoryProfitCell';

const inventoryColumns: ColumnDef<InventoryVariant>[] = [
  {
    id: 'title',
    header: __('Variants', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { cssOverride: styles.productCell },
    cell: ({ row }) => <InventoryTitleCell item={row.original} />,
  },
  {
    id: 'sku',
    header: __('SKU', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { cssOverride: styles.inputCell },
    cell: ({ row }) => <InventorySkuCell item={row.original} />,
  },
  {
    id: 'base_price',
    header: __('Price', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { cssOverride: styles.inputCell },
    cell: ({ row }) => <InventoryPriceCell item={row.original} />,
  },
  {
    id: 'base_sale_price',
    header: __('Sale Price', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { cssOverride: styles.inputCell },
    cell: ({ row }) => <InventorySalePriceCell item={row.original} />,
  },
  {
    id: 'base_cost_of_goods',
    header: __('Cost of Goods', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { cssOverride: styles.inputCell },
    cell: ({ row }) => <InventoryCostOfGoodsCell item={row.original} />,
  },
  {
    id: 'profit',
    header: __('Profit', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { cssOverride: styles.profitCell },
    cell: ({ row }) => <InventoryProfitCell item={row.original} />,
  },
];

export { inventoryColumns };
