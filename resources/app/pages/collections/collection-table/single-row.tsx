import { useNavigate } from 'react-router';

import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import { TableCell, TableRow } from '@/molecules/table';
import Text from '@/molecules/text';
import Thumbnail from '@/molecules/thumbnail';
import { useDeleteCollectionMutation } from '@/services/collection';
import type { Collection, MarkListHandlers } from '@/types';
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
    navigate('/collections/' + id);
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
          <Flex gap={8} style={{ alignItems: 'center' }}>
            <Thumbnail size="small" src={banner?.url} />
            <Text type="xsm" header={item?.title || '--'} />
          </Flex>
        </TableCell>
        <TableCell>{item?.count || 0}</TableCell>
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
    </>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
