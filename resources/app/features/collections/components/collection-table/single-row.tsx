import { useNavigate } from 'react-router';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { TableCell, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { RouteConfig } from '@/config/route-config';
import type { Collection } from '@/features/collections/schemas/catalog/collection';
import { useDeleteCollectionMutation } from '@/features/collections/services/collection';
import { EditPenIcon, TrashIcon } from '@/icons';
import type { MarkListHandlers } from '@/types/pages/common';
import { __ } from '@/wpi18n';

type SingleRowProps = MarkListHandlers & {
  item: Collection;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const navigate = useNavigate();
  const deleteMutation = useDeleteCollectionMutation();

  const handleItemClick = (id: number) => {
    void navigate(RouteConfig.Collections.get('CollectionDetail').buildLink({ id }));
  };

  const onItemDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const banner =
    item?.banner && typeof item.banner === 'object' ? item.banner : null;

  return (
    <>
      <TableRow
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
            <Thumbnail size="small" src={banner?.url} />
            <Text variant="small">{item?.title || '--'}</Text>
          </Flex>
        </TableCell>
        <TableCell>{item?.count ?? 0}</TableCell>
        <TableCell>{item?.created_at ?? '--'}</TableCell>
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
    </>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
