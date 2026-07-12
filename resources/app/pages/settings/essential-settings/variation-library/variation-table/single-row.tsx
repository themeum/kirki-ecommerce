import { useState } from 'react';
import { useOutletContext } from 'react-router';

import { EditPenIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import { TableCell, TableRow } from '@/molecules/table';
import {
  deleteAttributeValueByIdAPI,
  setKeyValue,
} from '@/store/attributesSlice';
import { useAppDispatch } from '@/store/hooks';
import type {
  Attribute,
  AttributeValue,
  ConfirmationVariant,
  MarkListHandlers,
} from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '@/pages/utils';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import VariationValuePopup from '@/pages/settings/essential-settings/variation-library/variation-value-popup';

type AttributeWithMeta = Attribute & { updated_at?: string };

type SettingsOutletContext = {
  confirmAction: (params: {
    action?: () => void;
    otherProps?: {
      variant?: ConfirmationVariant;
      force?: boolean;
      title?: string;
      subtitle?: string;
    };
  }) => void;
};

type SingleRowProps = MarkListHandlers & {
  item: AttributeValue;
  selectedItem?: AttributeWithMeta;
};

const SingleRow = ({
  item,
  isSelected,
  handleSingleCheckboxClick,
  selectedItem,
}: SingleRowProps) => {
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const [editedItem, setEditedItem] = useState<AttributeValue | null>(null);
  const dispatch = useAppDispatch();

  const handleAttributeValueRemove = async () => {
    setUnsavedDataStatus(true);
    confirmAction({
      action: () => onDeleteValue(),
      otherProps: {
        variant: 'delete',
        force: true,
        title: __('Delete attribute value?', 'kirki-ecommerce'),
        subtitle: __(
          'Are you sure you want to delete this value? This action cannot be undone.',
          'kirki-ecommerce',
        ),
      },
    });
  };

  const onDeleteValue = async () => {
    const params = { attribute_id: selectedItem?.id as number, value_id: item?.id };
    const result = await deleteAttributeValueByIdAPI(params);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
    } else {
      dispatchToastMessage('error', { title: 'Something went wrong' });
    }
  };

  return (
    <>
      <TableRow key={item.id}>
        <TableCell onlyCheckbox>
          <Checkbox
            value={isSelected(item.id)}
            onChange={(value) => handleSingleCheckboxClick(value, item.id)}
          />
        </TableCell>
        <TableCell>
          <Flex gap={12} style={{ alignItems: 'center' }}>
            {selectedItem?.type === 'color' && (
              <div
                style={{
                  height: '32px',
                  width: '32px',
                  minWidth: '32px',
                  borderRadius: 'var(--decom-radius-rounded-md)',
                  border: '1.17px solid var(--decom-border-border) ',
                  background: `${item?.color}`,
                }}
              ></div>
            )}
            {item?.value}
          </Flex>
        </TableCell>

        {selectedItem?.type === 'color' && <TableCell>{item?.color}</TableCell>}
        <TableCell>{selectedItem?.updated_at}</TableCell>
        <TableCell alignment="right" style={{ width: '1%' }}>
          <ActionGroup>
            <Button
              type="secondary"
              icon={<TrashIcon />}
              onClick={handleAttributeValueRemove}
              size="small"
            />
            <Button
              type="secondary"
              icon={<EditPenIcon />}
              onClick={() => setEditedItem(item)}
              size="small"
            />
          </ActionGroup>
        </TableCell>
      </TableRow>
      {editedItem && (
        <VariationValuePopup
          isOpen={Boolean(editedItem)}
          onClose={() => setEditedItem(null)}
          editedItem={editedItem}
          type={selectedItem?.type}
          selectedItem={selectedItem}
        />
      )}
    </>
  );
};

export default SingleRow;
