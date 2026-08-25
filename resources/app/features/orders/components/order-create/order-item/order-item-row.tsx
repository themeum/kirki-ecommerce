import { Cross2Icon } from '@radix-ui/react-icons';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import QuantityStepper from '@/features/orders/components/order-create/order-item/quantity-stepper';
import type { OrderCalculation } from '@/features/orders/schemas/catalog/order';
import type { OrderItem } from '@/features/orders/types';

const EMPTY_AMOUNT = '—';

type OrderItemRowProps = {
  row: OrderItem;
  calculationItem?: OrderCalculation['items'][number];
  onQuantityChange: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
};

const OrderItemRow = ({ row, calculationItem, onQuantityChange, onRemove }: OrderItemRowProps) => {
  const { display, quantity, index } = row;
  const lineTotal = calculationItem ? calculationItem.base_total_money_object.display : EMPTY_AMOUNT;

  return (
    <TableRow>
      <TableCell>
        <Flex gap={3} align="center">
          <Thumbnail src={display.thumbnail ?? undefined} alt={display.productTitle} />
          <Flex direction="column" gap={1}>
            <Text variant="small">{display.productTitle}</Text>
            {display.variantLabel && (
              <Text variant="small" color="secondary">
                {display.variantLabel}
              </Text>
            )}
          </Flex>
        </Flex>
      </TableCell>
      <TableCell>
        <QuantityStepper
          value={quantity}
          onChange={(nextQuantity) => onQuantityChange(index, nextQuantity)}
        />
      </TableCell>
      <TableCell alignment="right" cssOverride={{ width: '160px' }}>
        <Text variant="small">{lineTotal}</Text>
      </TableCell>
      <TableCell onlyCheckbox>
        <ActionGroup>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Remove item"
            onClick={() => onRemove(index)}
          >
            <Cross2Icon />
          </Button>
        </ActionGroup>
      </TableCell>
    </TableRow>
  );
};

OrderItemRow.displayName = 'OrderItemRow';

export default OrderItemRow;
