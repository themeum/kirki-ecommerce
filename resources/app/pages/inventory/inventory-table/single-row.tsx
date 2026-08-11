import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import Thumbnail from '@/components/ui/thumbnail';
import { useInventoryForm } from '@/contexts/inventory-form-context';
import { calculateProfit } from '@/pages/utils';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { InventoryVariant, MarkListHandlers } from '@/types';

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
      <TableCell cssOverride={styles.productCell}>
        <Flex gap={3} align="center">
          <Thumbnail src={item?.product?.image?.url} size="small" />
          <Flex direction="column" gap={1} cssOverride={styles.mutedText}>
            <span>{item?.product?.name} </span>
            <span>{item?.name}</span>
          </Flex>
        </Flex>
      </TableCell>
      {selectedFields.includes('sku') && (
        <TableCell cssOverride={styles.inputCell}>
          <Input
            value={item?.sku ?? undefined}
            placeholder="--"
            invisible
            cssOverride={styles.tableInput}
            onChange={(event) => handleOnChange(event.target.value, 'sku')}
          />
        </TableCell>
      )}
      {selectedFields.includes('base_price') && (
        <TableCell cssOverride={styles.inputCell}>
          <Input
            value={item?.base_price ?? undefined}
            placeholder="--"
            invisible
            cssOverride={styles.tableInput}
            onChange={(event) => handleOnChange(event.target.value, 'base_price')}
          />
        </TableCell>
      )}
      {selectedFields.includes('base_sale_price') && (
        <TableCell cssOverride={styles.inputCell}>
          <Input
            value={item?.base_sale_price ?? undefined}
            placeholder="--"
            invisible
            cssOverride={styles.tableInput}
            onChange={(event) =>
              handleOnChange(event.target.value, 'base_sale_price')
            }
          />
        </TableCell>
      )}
      {selectedFields.includes('base_cost_of_goods') && (
        <TableCell cssOverride={styles.inputCell}>
          <Input
            value={item?.base_cost_of_goods ?? undefined}
            placeholder="--"
            invisible
            cssOverride={styles.tableInput}
            onChange={(event) =>
              handleOnChange(event.target.value, 'base_cost_of_goods')
            }
          />
        </TableCell>
      )}
      {selectedFields.includes('profit') && (
        <TableCell disabled cssOverride={styles.profitCell}>
          <Input
            value={calculateProfit('profit', item)}
            placeholder="--"
            readOnly
            invisible
            cssOverride={styles.tableInput}
          />
        </TableCell>
      )}
    </TableRow>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;

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
  mutedText: {
    color: theme.colors.text.subdued,
  },
  tableInput: {
    ...theme.typography.small(),
  },
});
