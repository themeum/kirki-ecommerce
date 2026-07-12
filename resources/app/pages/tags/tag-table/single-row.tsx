import { useState } from 'react';

import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import { TableCell, TableRow } from '@/molecules/table';
import { useAppDispatch } from '@/store/hooks';
import { deleteTagByIdAPI, setKeyValue } from '@/store/tagsSlice';
import type { MarkListHandlers, Tag } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import TagAddEditPopover from '@/pages/tags/tag-add-edit-popover';

type SingleRowProps = MarkListHandlers & {
  item: Tag;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
}: SingleRowProps) => {
  const [openPopup, setOpenPopup] = useState(false);
  const dispatch = useAppDispatch();

  const onItemDelete = async (id: number) => {
    const result = await deleteTagByIdAPI(id);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
    } else {
      console.log(result);
    }
  };
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
        <TableCell style={{ width: '20%' }}>{item?.name || '--'}</TableCell>
        <TableCell style={{ width: '30%' }}>
          {item?.description || '--'}
        </TableCell>
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
        <TagAddEditPopover tag={item} onClose={() => setOpenPopup(false)} />
      )}
    </>
  );
};

export default SingleRow;
