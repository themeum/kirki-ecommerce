import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import PriceText from '@/components/ui/price-text';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import type { Order } from '@/features/orders/schemas/catalog/order';
import { TagIcon } from '@/icons/common';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { sprintf } from '@/wpi18n';

type ItemsTableProps = {
  items: Order['items'];
};

const ItemsTable = ({ items }: ItemsTableProps) => {
  return (
    <Table cssOverride={styles.itemsTable}>
      <TableBody>
        {items.map((item) => {
          const subtotal = item.base_subtotal_money_object;
          const unitPrice = item.base_unit_price_money_object;
          const unitStrikethrough = item.base_unit_strikethrough_price_money_object;

          return (
            <TableRow key={item.id}>
              <TableCell>
                <Flex gap={3} align="center">
                  <Image src={item.image} alt={item.product_name ?? undefined} />
                  <Flex direction="column" gap={2}>
                    <Text variant="small">{item.product_name}</Text>
                    {Boolean(item.variant_name) && (
                      <Text variant="small" color="secondary">
                        {item.variant_name}
                      </Text>
                    )}
                    {item.applied_product_coupons.map((coupon) => (
                      <Flex key={coupon.code} gap={1} align="center">
                        <TagIcon />
                        <Text variant="tiny" color="secondary">
                          {sprintf(
                            '%s (-%s)',
                            coupon.code,
                            coupon.base_discount_amount_money_object.display,
                          )}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </Flex>
              </TableCell>
              <TableCell alignment="right" cssOverride={{ width: '88px' }}>
                <PriceText
                  salePrice={unitStrikethrough ? unitPrice : undefined}
                  regularPrice={unitStrikethrough ?? unitPrice}
                  direction="column"
                  align="end"
                />
              </TableCell>
              <TableCell alignment="center" cssOverride={{ width: '88px' }}>
                <Text color="subdued" variant="small" weight="medium">
                  {sprintf('x%s', item.quantity)}
                </Text>
              </TableCell>
              <TableCell alignment="right" cssOverride={{ width: '88px' }}>
                <Text variant="tiny" weight="medium">
                  {subtotal.display}
                </Text>
              </TableCell>
              <TableCell cssOverride={{ width: '42px' }} />
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

ItemsTable.displayName = 'ItemsTable';

export default ItemsTable;

const styles = defineStyles({
  itemsTable: {
    '& th, & td': {
      padding: '10px',
    },
    '& tbody tr:hover, & tbody tr[data-active="true"]': {
      backgroundColor: theme.colors.background.surface,
    },
    '& tbody tr:last-child': {
      borderBottom: 'none',
    },
  },
});
