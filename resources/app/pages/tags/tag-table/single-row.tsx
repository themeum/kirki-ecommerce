import { useState, type MouseEvent } from 'react';

import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import { TableCell, TableRow } from '@/molecules/table';
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
              <Button
                size="small"
                text={__('Edit', 'kirki-ecommerce')}
                type="secondary"
                leftIcon={<EditPenIcon />}
                onClick={handleOpenEdit}
              />
              <Button
                size="small"
                type="destructiveSoft"
                icon={<TrashIcon />}
                onClick={handleDelete}
              />
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
