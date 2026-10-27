import { PlusIcon } from 'lucide-react';

import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Table, TableBody } from '@/components/ui/table';
import Text from '@/components/ui/text';
import OrderItemRow from '@/features/orders/components/order-create/order-item/order-item-row';
import { useOrderCreate } from '@/features/orders/hooks/use-order-create';
import { ProductSelectionIcon } from '@/icons/common';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type ProductSelectionCardProps = {
  onOpenPicker: () => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
};

const ProductSelectionCard = ({
  onOpenPicker,
  onQuantityChange,
  onRemoveItem,
}: ProductSelectionCardProps) => {
  const { rows } = useOrderCreate();

  if (rows.length === 0) {
    return (
      <Card cssOverride={mergeCss(cardStyles.formCard, styles.emptyCard)}>
        <CardContent>
          <Flex direction="column" gap={9} align="center" justify="center">
            <ProductSelectionIcon />
            <Button size="sm" variant="secondary" onClick={onOpenPicker}>
              <PlusIcon size={16} />
              {__('Add products', 'kirki-ecommerce')}
            </Button>
          </Flex>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card cssOverride={mergeCss(cardStyles.formCard, { rowGap: theme.spacing[3] })}>
      <CardHeader cssOverride={styles.headerRow}>
        <CardTitle>
          <Text variant="heading6" weight="semibold">
            {sprintf(
              /* translators: %s: number of items */
              __('Products (%s)', 'kirki-ecommerce'),
              rows.length,
            )}
          </Text>
        </CardTitle>
        <Button variant="secondary" onClick={onOpenPicker}>
          <PlusIcon size={16} />
          {__('Add more', 'kirki-ecommerce')}
        </Button>
      </CardHeader>
      <CardContent>
        <Card cssOverride={mergeCss(cardStyles.innerCard, { overflow: 'hidden' })}>
          <CardContent cssOverride={styles.zeroPadding}>
            <Table cssOverride={styles.itemsTable}>
              <TableBody>
                {rows.map((row) => (
                  <OrderItemRow
                    key={row.display.variantId}
                    row={row}
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
    paddingBlock: theme.spacing[12],
    border: 'none',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zeroPadding: {
    padding: 0,
  },
  itemsTable: {
    '& th, & td': {
      padding: '10px',
    },
    '& tbody tr:last-child': {
      borderBottom: 'none',
    },
  },
});
