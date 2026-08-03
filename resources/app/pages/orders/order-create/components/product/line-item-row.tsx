import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import QuantityStepper from '@/pages/orders/order-create/components/product/quantity-stepper';
import { formatCurrency } from '@/pages/orders/order-create/config/order-totals';
import type { OrderLineRow } from '@/pages/orders/order-create/types';
import { Cross2Icon } from '@radix-ui/react-icons';

type LineItemRowProps = {
  row: OrderLineRow;
  onQuantityChange: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
};

const LineItemRow = ({ row, onQuantityChange, onRemove }: LineItemRowProps) => {
  const { display, quantity, index } = row;

  return (
    <TableRow>
      <TableCell>
        <Flex gap={3} align="center">
          <Thumbnail src={display.thumbnail ?? undefined} alt={display.productTitle} />
          <Flex direction="column" gap={1}>
            <Text variant='small'>{display.productTitle}</Text>
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
        <Text variant="small">{formatCurrency(display.unitPrice * quantity)}</Text>
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

LineItemRow.displayName = 'LineItemRow';

export default LineItemRow;
