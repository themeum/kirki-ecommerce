import { useNavigate } from 'react-router';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { RouteConfig } from '@/config/route-config';
import type { CustomerListItem } from '@/features/customers/schemas/catalog/customer';
import { useDeleteCustomerMutation } from '@/features/customers/services/customer';
import { EditPenIcon, TrashIcon } from '@/icons';
import type { MarkListHandlers } from '@/types/pages/common';
import { displayMoney } from '@/utils/money';
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
    void navigate(RouteConfig.Customers.get('CustomerDetail').buildLink({ id }));
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
        <Flex gap={3} align="center">
          <Thumbnail src={photo?.url} size="small" type="circle" />
          <Flex direction="column" gap={1}>
            <Text variant="tiny" weight="medium">
              {item?.first_name} {item?.last_name}
            </Text>
            <Text variant="tiny" color="secondary">
              {item?.email}
            </Text>
          </Flex>
        </Flex>
      </TableCell>
      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a customer with 0 orders renders as '--' like the other empty cells in this row; ?? would print 0 */}
      <TableCell>{item?.orders_count || '--'}</TableCell>
      <TableCell>{displayMoney('base_amount_spent', item)}</TableCell>
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
