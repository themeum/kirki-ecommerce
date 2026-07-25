import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
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
        <Flex gap={2} align="center">
          <Thumbnail src={photo?.url} size="small" type="circle" />
          <Flex direction="column" gap={2}>
            <div>
              {item?.first_name} {item?.last_name}
            </div>
            <Text variant="small" color="emphasis">{item?.email}</Text>
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
            variant="secondary"
            onClick={() => {
              handleItemClick(item.id);
            }}
          >
            <EditPenIcon />
            {__('Edit', 'kirki-ecommerce')}
          </Button>
          <Button
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
