import { useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import Thumbnail from '@/components/ui/thumbnail';
import BrandAddEditPopover from '@/features/brands/components/brand-add-edit-dialog';
import type { Brand } from '@/features/brands/schemas/catalog/brand';
import { useDeleteBrandMutation } from '@/features/brands/services/brand';
import { EditPenIcon, TrashIcon } from '@/icons';
import type { MarkListHandlers } from '@/types/pages/common';
import { __ } from '@/wpi18n';

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
        <TableCell>{item?.count ?? 0}</TableCell>
        <TableCell alignment="right" style={{ width: '1%' }}>
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
        <BrandAddEditPopover brand={item} onClose={() => setOpenPopup(false)} />
      )}
    </>
  );
};

SingleRow.displayName = 'SingleRow';

export default SingleRow;
