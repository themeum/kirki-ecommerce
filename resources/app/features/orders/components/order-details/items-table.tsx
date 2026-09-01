import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import type { OrderItem } from '@/features/orders/schemas/catalog/order';
import { sprintf } from '@/wpi18n';

type ItemsTableProps = {
  items: OrderItem['items'];
};

const ItemsTable = ({ items }: ItemsTableProps) => {
  return (
    <Table>
      <TableBody>
        {items.map((item) => (
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
                </Flex>
              </Flex>
            </TableCell>
            <TableCell alignment="right">
              <Text color="subdued" variant="small" weight="medium">
                {sprintf('%s x %s', item.base_price_money_object.display, item.quantity)}
              </Text>
            </TableCell>
            <TableCell alignment="right">
              <Text variant="tiny" weight="medium">
                {item.base_total_money_object.display}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

ItemsTable.displayName = 'ItemsTable';

export default ItemsTable;
