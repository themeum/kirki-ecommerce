import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Table, TableBody } from '@/components/ui/table';
import Text from '@/components/ui/text';
import { PlusIcon, ProductIcon } from '@/icons';
import OrderItemRow from '@/pages/orders/order-create/components/order-item/order-item-row';
import type { OrderItem } from '@/pages/orders/order-create/types';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { OrderCalculation } from '@/types';
import { __ } from '@/wpi18n';

type ProductSelectionCardProps = {
  rows: OrderItem[];
  calculationItems?: OrderCalculation['items'];
  onOpenPicker: () => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
};

const ProductSelectionCard = ({
  rows,
  calculationItems,
  onOpenPicker,
  onQuantityChange,
  onRemoveItem,
}: ProductSelectionCardProps) => {
  if (rows.length === 0) {
    return (
      <Card cssOverride={mergeCss(cardStyles.formCard, styles.emptyCard)}>
        <CardContent>
          <Flex direction="column" gap={3} align="center" justify="center">
            <ProductIcon />
            <Button variant="secondary" onClick={onOpenPicker}>
              <PlusIcon />
              <Text variant="small" weight="medium">{__('Select Product', 'kirki-ecommerce')}</Text>
            </Button>
          </Flex>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader cssOverride={styles.headerRow}>
        <CardTitle>
          <Text variant="heading6" weight="semibold">{__('Items', 'kirki-ecommerce')}({rows.length})</Text>
        </CardTitle>
        <Button variant="secondary" onClick={onOpenPicker}>
          <PlusIcon />
          {__('Select More', 'kirki-ecommerce')}
        </Button>
      </CardHeader>
      <CardContent>
        <Card cssOverride={cardStyles.innerCard}>
          <CardContent cssOverride={styles.zeroPadding}>
            <Table>
              <TableBody>
                {rows.map((row) => (
                  <OrderItemRow
                    key={row.display.variantId}
                    row={row}
                    calculationItem={calculationItems?.[row.index]}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemoveItem}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

ProductSelectionCard.displayName = 'ProductSelectionCard';

export default ProductSelectionCard;

const styles = defineStyles({
  emptyCard: {
    borderStyle: 'dashed',
    paddingBlock: '48px',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zeroPadding: {
    padding: 0,
  },
});
