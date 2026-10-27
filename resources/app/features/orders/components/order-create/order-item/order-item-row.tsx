import { Cross2Icon } from '@radix-ui/react-icons';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import PriceText from '@/components/ui/price-text';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import QuantityStepper from '@/features/orders/components/order-create/order-item/quantity-stepper';
import { useOrderCreate } from '@/features/orders/hooks/use-order-create';
import { getQuantityLimit } from '@/features/orders/lib/order-items';
import type { OrderItem } from '@/features/orders/types';

const EMPTY_AMOUNT = '—';

type OrderItemRowProps = {
  row: OrderItem;
  onQuantityChange: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
};

const OrderItemRow = ({ row, onQuantityChange, onRemove }: OrderItemRowProps) => {
  const { display, quantity, index } = row;
  const { calculationItemById } = useOrderCreate();
  const calculationItem = calculationItemById.get(index);
  const quantityLimit = getQuantityLimit(display);
  const lineTotal = calculationItem
    ? calculationItem.base_subtotal_money_object.display
    : EMPTY_AMOUNT;

  return (
    <TableRow>
      <TableCell>
        <Flex gap={3} align="center">
          <Image src={display.thumbnail} alt={display.productTitle} />
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
      <TableCell alignment="right" cssOverride={{ width: '88px' }}>
        <PriceText salePrice={display.salePrice} regularPrice={display.regularPrice} />
      </TableCell>
      <TableCell cssOverride={{ width: '88px' }}>
        <QuantityStepper
          value={quantity}
          max={quantityLimit?.max}
          disabledMessage={quantityLimit?.reason}
          onChange={(nextQuantity) => onQuantityChange(index, nextQuantity)}
        />
      </TableCell>
      <TableCell alignment="right" cssOverride={{ width: '88px' }}>
        <Text variant="small">{lineTotal}</Text>
      </TableCell>
      <TableCell onlyCheckbox>
        <ActionGroup>
          <Button
            variant="ghost"
            size="icon"
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
