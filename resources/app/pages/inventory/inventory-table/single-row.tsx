import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import { TableCell, TableRow } from '@/molecules/table';
import Thumbnail from '@/molecules/thumbnail';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setKeyValue, updateInventory } from '@/store/inventorySlice';
import type { InventoryVariant, MarkListHandlers } from '@/types';

import { calculateProfit } from '../../utils';

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
  const dispatch = useAppDispatch();
  const { hasChanges } = useAppSelector((state) => state.inventory);

  const handleOnChange = (value: string | number, fieldName: string) => {
    if (!hasChanges) {
      dispatch(setKeyValue({ key: 'hasChanges', value: true }));
    }
    const changes = { [fieldName]: value };
    dispatch(updateInventory({ id: item.id, changes }));
  };

  return (
    <TableRow key={item.id}>
      <TableCell onlyCheckbox>
        <Checkbox
          value={isSelected(item.id)}
          onChange={(value) => handleSingleCheckboxClick(value, item.id)}
        />
      </TableCell>
      <TableCell style={{ minWidth: '208px', padding: '7px 12px' }}>
        <Flex gap={12} style={{ alignItems: 'center' }}>
          <Thumbnail src={item?.product?.image?.url} size="small" />

          <Flex direction="column" gap={4} style={{ color: '#878593' }}>
            <span>{item?.product?.name} </span>
            <span>{item?.name}</span>
          </Flex>
        </Flex>
      </TableCell>
      {selectedFields.includes('sku') && (
        <TableCell style={{ padding: '0' }}>
          <Input
            value={item?.sku ?? undefined}
            placeholder="--"
            invisible
            style={{ fontSize: '12px', lineHeight: '18px', fontWeight: '400' }}
            onChange={(value) => handleOnChange(value, 'sku')}
          />
        </TableCell>
      )}
      {selectedFields.includes('price') && (
        <TableCell style={{ padding: '0' }}>
          <Input
            value={item?.price ?? undefined}
            placeholder="--"
            invisible
            style={{ fontSize: '12px', lineHeight: '18px', fontWeight: '400' }}
            onChange={(value) => handleOnChange(value, 'price')}
          />
        </TableCell>
      )}
      {selectedFields.includes('sale_price') && (
        <TableCell style={{ padding: '0' }}>
          <Input
            value={item?.sale_price ?? undefined}
            placeholder="--"
            invisible
            style={{ fontSize: '12px', lineHeight: '18px', fontWeight: '400' }}
            onChange={(value) => handleOnChange(value, 'sale_price')}
          />
        </TableCell>
      )}
      {selectedFields.includes('cost_of_goods') && (
        <TableCell style={{ padding: '0' }}>
          <Input
            value={item?.cost_of_goods ?? undefined}
            placeholder="--"
            invisible
            style={{ fontSize: '12px', lineHeight: '18px', fontWeight: '400' }}
            onChange={(value) => handleOnChange(value, 'cost_of_goods')}
          />
        </TableCell>
      )}
      {selectedFields.includes('profit') && (
        <TableCell disabled style={{ padding: '0', pointerEvents: 'none' }}>
          <Input
            value={calculateProfit('profit', item)}
            placeholder="--"
            invisible
            style={{ fontSize: '12px', lineHeight: '18px', fontWeight: '400' }}
          />
        </TableCell>
      )}
    </TableRow>
  );
};

export default SingleRow;
