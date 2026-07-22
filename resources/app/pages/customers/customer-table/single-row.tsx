import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import { TableCell, TableRow } from '@/molecules/table';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import { useDeleteCustomerMutation } from '@/services/customer';
import type { CustomerListItem, MarkListHandlers } from '@/types';
import { __ } from '@/wpi18n';

type SingleRowProps = MarkListHandlers & {
  item: CustomerListItem;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const navigate = useNavigate();
  const deleteMutation = useDeleteCustomerMutation();

  const handleItemClick = (id: number) => {
    navigate('/customers/' + id);
  };

  const onItemDelete = (id: number) => {
    deleteMutation.mutate(id);
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
            size="sm"
            variant="secondary"
            onClick={() => {
              handleItemClick(item.id);
            }}
          >
            <EditPenIcon />
            {__('Edit', 'kirki-ecommerce')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label={__('Delete', 'kirki-ecommerce')}
            onClick={() => {
              onItemDelete(item.id);
            }}
          >
            <TrashIcon />
          </Button>
        </ActionGroup>
      </TableCell>
    </TableRow>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
