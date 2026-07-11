import { useNavigate } from 'react-router';

import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import { TableCell, TableRow } from '@/molecules/table';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import {
  deleteCustomerByIdAPI,
  setKeyValue,
} from '@/store/customersSlice';
import { useAppDispatch } from '@/store/hooks';
import type { Customer, MarkListHandlers } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

type SingleRowProps = MarkListHandlers & {
  item: Customer;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleItemClick = (id: number) => {
    navigate('/customers/' + id);
  };

  const onItemDelete = async (id: number) => {
    const result = await deleteCustomerByIdAPI(id);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
    } else {
      console.log(result);
    }
  };

  const photo =
    item?.photo && typeof item.photo === 'object' ? item.photo : null;

  return (
    <TableRow
      key={item.id}
      style={{ cursor: 'pointer' }}
      onClick={() => handleItemClick(item.id)}
    >
      <TableCell onlyCheckbox>
        <Checkbox
          value={isSelected(item.id)}
          onChange={(value) => handleSingleCheckboxClick(value, item.id)}
        />
      </TableCell>
      <TableCell>
        <Flex gap={8} style={{ alignItems: 'center' }}>
          <Thumbnail src={photo?.url} size="small" type="circle" />
          <Flex direction="column" gap={6}>
            <div>
              {item?.first_name} {item?.last_name}
            </div>
            <Text header={item?.email} type="xsm" emphasis />
          </Flex>
        </Flex>
      </TableCell>
      <TableCell>{item?.orders_count || '--'}</TableCell>
      <TableCell>{item?.amount_spent || '--'}</TableCell>
      <TableCell>{item?.location || '--'}</TableCell>
      <TableCell>{item?.last_order_date || '--'}</TableCell>
      <TableCell>{item?.created_at || '--'}</TableCell>
      <TableCell alignment="right">
        <ActionGroup>
          <Button
            size="small"
            text={__('Edit', 'kirki-ecommerce')}
            type="secondary"
            leftIcon={<EditPenIcon />}
            onClick={() => {
              handleItemClick(item.id);
            }}
          />
          <Button
            size="small"
            type="destructiveSoft"
            icon={<TrashIcon />}
            onClick={() => {
              onItemDelete(item.id);
            }}
          />
        </ActionGroup>
      </TableCell>
    </TableRow>
  );
};

export default SingleRow;
