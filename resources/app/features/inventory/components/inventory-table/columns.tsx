import type { ColumnDef } from '@tanstack/react-table';
import { Fragment } from 'react';

import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import {
  EMPTY_VALUE,
  resolveAvailableCell,
  resolveCommittedCell,
} from '@/features/inventory/lib/inventory-cells';
import type { InventoryVariant } from '@/features/products';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const styles = defineStyles({
  productCell: {
    minWidth: '208px',
    padding: `7px ${theme.spacing[3]}`,
  },
  separator: {
    color: theme.colors.text.disabled,
    margin: `0 ${theme.spacing[1]}`,
  },
});

const InventoryTitleCell = ({ item }: { item: InventoryVariant }) => (
  <Flex gap={3} align="center">
    <Image src={item.product.image} size="sm" />
    <Flex direction="column" gap={1}>
      <Text variant="tiny" weight="medium">
        {item.product.name}
      </Text>
      {item.attribute_value_labels.length > 0 && (
        <Text variant="tiny" color="secondary">
          {item.attribute_value_labels.map((label, index) => (
            <Fragment key={`${index}-${label}`}>
              {index > 0 && <span css={scoped(styles.separator)}>|</span>}
              {label}
            </Fragment>
          ))}
        </Text>
      )}
    </Flex>
  </Flex>
);

InventoryTitleCell.displayName = 'InventoryTitleCell';

const InventoryAvailableCell = ({ item }: { item: InventoryVariant }) => {
  const { text, color } = resolveAvailableCell(item);

  return (
    <Text variant="tiny" color={color}>
      {text}
    </Text>
  );
};

InventoryAvailableCell.displayName = 'InventoryAvailableCell';

const InventoryCommittedCell = ({ item }: { item: InventoryVariant }) => {
  const { text, color } = resolveCommittedCell(item);

  return (
    <Text variant="tiny" color={color}>
      {text}
    </Text>
  );
};

InventoryCommittedCell.displayName = 'InventoryCommittedCell';

const inventoryColumns: ColumnDef<InventoryVariant>[] = [
  {
    id: 'title',
    header: __('Product', 'kirki-ecommerce'),
    enableSorting: true,
    meta: { cssOverride: styles.productCell },
    cell: ({ row }) => <InventoryTitleCell item={row.original} />,
  },
  {
    id: 'sku',
    header: __('SKU', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => <Text variant="tiny">{row.original.sku || EMPTY_VALUE}</Text>,
  },
  {
    id: 'available_quantity',
    header: __('Available', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => <InventoryAvailableCell item={row.original} />,
  },
  {
    id: 'committed_quantity',
    header: __('Committed', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => <InventoryCommittedCell item={row.original} />,
  },
];

export { inventoryColumns };
