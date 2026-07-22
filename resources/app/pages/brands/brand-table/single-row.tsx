import { useState } from 'react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import { TableCell, TableRow } from '@/components/ui/table';
import Thumbnail from '@/components/ui/thumbnail';
import { useDeleteBrandMutation } from '@/services/brand';
import type { Brand, MarkListHandlers } from '@/types';
import { __ } from '@/wpi18n';

import BrandAddEditPopover from '@/pages/brands/brand-add-edit-dialog';

type SingleRowProps = MarkListHandlers & {
  item: Brand;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const [openPopup, setOpenPopup] = useState(false);
  const deleteMutation = useDeleteBrandMutation();

  const onItemDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const logo =
    item?.logo && typeof item.logo === 'object' ? item.logo : null;

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
            src={logo?.url}
            style={{ height: '48px', width: '48px' }}
          />
        </TableCell>
        <TableCell>{item?.description || '--'}</TableCell>
        <TableCell>{item?.slug || '--'}</TableCell>
        <TableCell>{item?.count || 0}</TableCell>
        <TableCell alignment="right" style={{ width: '1%' }}>
          <ActionGroup>
            <Button
              size="sm"
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
        <BrandAddEditPopover brand={item} onClose={() => setOpenPopup(false)} />
      )}
    </>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
