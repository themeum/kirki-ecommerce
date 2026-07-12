import { useState } from 'react';

import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import { TableCell, TableRow } from '@/molecules/table';
import Thumbnail from '@/molecules/thumbnail';
import {
  deleteBrandByIdAPI,
  setKeyValue,
} from '@/store/brandsSlice';
import { useAppDispatch } from '@/store/hooks';
import type { Brand, MarkListHandlers } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import BrandAddEditPopover from '@/pages/brands/brand-add-edit-popover';

type SingleRowProps = MarkListHandlers & {
  item: Brand;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const [openPopup, setOpenPopup] = useState(false);
  const dispatch = useAppDispatch();

  const onItemDelete = async (id: number) => {
    const result = await deleteBrandByIdAPI(id);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
    } else {
      console.log(result);
    }
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
            value={isSelected(item.id)}
            onChange={(value) => handleSingleCheckboxClick(value, item.id)}
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
              size="small"
              text={__('Edit', 'kirki-ecommerce')}
              type="secondary"
              leftIcon={<EditPenIcon />}
              onClick={() => {
                setOpenPopup(true);
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
      {openPopup && (
        <BrandAddEditPopover brand={item} onClose={() => setOpenPopup(false)} />
      )}
    </>
  );
};

export default SingleRow;
