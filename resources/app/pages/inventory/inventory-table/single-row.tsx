import Input from '@/components/ui/input';
import { useInventoryForm } from '@/contexts/inventory-form-context';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Thumbnail from '@/components/ui/thumbnail';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { InventoryVariant, MarkListHandlers } from '@/types';

import { calculateProfit } from '@/pages/utils';

type SingleRowProps = MarkListHandlers & {
  item: InventoryVariant;
  selectedFields: string[];
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
  selectedFields,
}: SingleRowProps) => {
  const { updateInventory } = useInventoryForm();

  const handleOnChange = (value: string, fieldName: string) => {
    updateInventory({ id: item.id, changes: { [fieldName]: value } });
  };

  return (
    <TableRow key={item.id}>
      <TableCell onlyCheckbox>
        <Checkbox
          value={isSelected(item.id)}
          onChange={(value) => handleSingleCheckboxClick(value, item.id)}
        />
      </TableCell>
      <TableCell css={styles.productCell}>
        <Flex gap={3} align="center">
          <Thumbnail src={item?.product?.image?.url} size="small" />
          <Flex direction="column" gap={1} css={styles.mutedText}>
            <span>{item?.product?.name} </span>
            <span>{item?.name}</span>
          </Flex>
        </Flex>
      </TableCell>
      {selectedFields.includes('sku') && (
        <TableCell css={styles.inputCell}>
          <Input
            value={item?.sku ?? undefined}
            placeholder="--"
            invisible
            css={styles.tableInput}
            onChange={(event) => handleOnChange(event.target.value, 'sku')}
          />
        </TableCell>
      )}
      {selectedFields.includes('price') && (
        <TableCell css={styles.inputCell}>
          <Input
            value={item?.price ?? undefined}
            placeholder="--"
            invisible
            css={styles.tableInput}
            onChange={(event) => handleOnChange(event.target.value, 'price')}
          />
        </TableCell>
      )}
      {selectedFields.includes('sale_price') && (
        <TableCell css={styles.inputCell}>
          <Input
            value={item?.sale_price ?? undefined}
            placeholder="--"
            invisible
            css={styles.tableInput}
            onChange={(event) =>
              handleOnChange(event.target.value, 'sale_price')
            }
          />
        </TableCell>
      )}
      {selectedFields.includes('cost_of_goods') && (
        <TableCell css={styles.inputCell}>
          <Input
            value={item?.cost_of_goods ?? undefined}
            placeholder="--"
            invisible
            css={styles.tableInput}
            onChange={(event) =>
              handleOnChange(event.target.value, 'cost_of_goods')
            }
          />
        </TableCell>
      )}
      {selectedFields.includes('profit') && (
        <TableCell disabled css={styles.profitCell}>
          <Input
            value={calculateProfit('profit', item)}
            placeholder="--"
            readOnly
            invisible
            css={styles.tableInput}
          />
        </TableCell>
      )}
    </TableRow>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;

const styles = {
  productCell: scoped({
    minWidth: '208px',
    padding: `7px ${theme.spacing[3]}`,
  }),
  inputCell: scoped({
    padding: theme.spacing[0],
  }),
  profitCell: scoped({
    padding: theme.spacing[0],
    pointerEvents: 'none',
  }),
  mutedText: scoped({
    color: theme.colors.text.subdued,
  }),
  tableInput: scoped({
    ...theme.typography.small(),
  }),
};
