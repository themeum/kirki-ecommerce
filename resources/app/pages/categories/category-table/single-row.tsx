import { useState } from 'react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import { TableCell, TableRow } from '@/components/ui/table';
import Thumbnail from '@/components/ui/thumbnail';
import { useDeleteCategoryMutation } from '@/services/category';
import type { Category, MarkListHandlers } from '@/types';
import { __ } from '@/wpi18n';

import CategoryAddEditPopover from '@/pages/categories/category-add-edit-dialog';

type SingleRowProps = MarkListHandlers & {
  item: Category;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const [openPopup, setOpenPopup] = useState(false);
  const deleteMutation = useDeleteCategoryMutation();

  const onItemDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const image =
    item?.image && typeof item.image === 'object' ? item.image : null;

  return (
    <>
      <TableRow
        key={item.id}
        onClick={() => setOpenPopup(true)}
        style={{ cursor: 'pointer' }}
      >
        <TableCell onlyCheckbox>
          <Checkbox
            checked={isSelected(item.id)}
            onCheckedChange={(value) =>
              handleSingleCheckboxClick(value === true, item.id)
            }
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
        <TableCell>{item?.name || '--'}</TableCell>
        <TableCell>
          <Thumbnail
            src={image?.url}
            style={{ height: '48px', width: '48px' }}
          />
        </TableCell>
        <TableCell style={{ minWidth: '200px' }}>
          {item?.description || '--'}
        </TableCell>
        <TableCell>{item?.slug || '--'}</TableCell>
        <TableCell>{item?.count || 0}</TableCell>
        <TableCell alignment="right" style={{ width: '135px' }}>
          <ActionGroup>
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPopup(true);
              }}
            >
              <EditPenIcon />
              {__('Edit', 'kirki-ecommerce')}
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onItemDelete(item.id);
              }}
            >
              <TrashIcon />
            </Button>
          </ActionGroup>
        </TableCell>
      </TableRow>
      {openPopup && (
        <CategoryAddEditPopover
          category={item}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
