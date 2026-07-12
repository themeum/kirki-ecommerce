import { useState } from 'react';

import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import { TableCell, TableRow } from '@/molecules/table';
import Thumbnail from '@/molecules/thumbnail';
import {
  deleteCategoryByIdAPI,
  setKeyValue,
} from '@/store/categoriesSlice';
import { useAppDispatch } from '@/store/hooks';
import type { Category, MarkListHandlers } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import CategoryAddEditPopover from '@/pages/categories/category-add-edit-popover';

type SingleRowProps = MarkListHandlers & {
  item: Category;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const [openPopup, setOpenPopup] = useState(false);
  const dispatch = useAppDispatch();

  const onItemDelete = async (id: number) => {
    const result = await deleteCategoryByIdAPI(id);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
    } else {
      console.log(result);
    }
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
            value={isSelected(item.id)}
            onChange={(value) => handleSingleCheckboxClick(value, item.id)}
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
        <CategoryAddEditPopover
          category={item}
          onClose={() => setOpenPopup(false)}
        />
      )}
    </>
  );
};

export default SingleRow;
