import { useState, type MouseEvent } from 'react';

import Button from '@/components/ui/button';
import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Checkbox from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { useDeleteTagMutation } from '@/services/tag';
import type { MarkListHandlers, Tag } from '@/types';
import { __ } from '@/wpi18n';

import TagAddEditDialog from '@/pages/tags/tag-add-edit-dialog';

type SingleRowProps = MarkListHandlers & {
  item: Tag;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteTagMutation();

  const handleOpenEdit = () => {
    setOpen(true);
  };

  const handleDelete = () => {
    deleteMutation.mutate(item.id);
  };

  const handleStopPropagation = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      <TableRow
        key={item.id}
        onClick={handleOpenEdit}
        style={{ cursor: 'pointer' }}
      >
        <TableCell onlyCheckbox>
          <Checkbox
            value={isSelected(item.id)}
            onChange={(value) => handleSingleCheckboxClick(value, item.id)}
          />
        </TableCell>
        <TableCell style={{ width: '20%' }}>{item?.name || '--'}</TableCell>
        <TableCell style={{ width: '30%' }}>
          {item?.description || '--'}
        </TableCell>
        <TableCell>{item?.slug || '--'}</TableCell>
        <TableCell>{item?.count || 0}</TableCell>
        <TableCell alignment="right" style={{ width: '1%' }}>
          <div onClick={handleStopPropagation}>
            <ActionGroup>
              <Button variant="secondary" onClick={handleOpenEdit}>
                <EditPenIcon />
                {__('Edit', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="secondary"
                aria-label={__('Delete', 'kirki-ecommerce')}
                onClick={handleDelete}
              >
                <TrashIcon />
              </Button>
            </ActionGroup>
          </div>
        </TableCell>
      </TableRow>
      <TagAddEditDialog
        tag={item}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
