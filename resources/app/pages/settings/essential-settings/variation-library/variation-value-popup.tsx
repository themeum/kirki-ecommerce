import { useState, useEffect } from 'react';

import ColorPicker from '@/molecules/color-picker';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import {
  addAttributeValueAPI,
  setKeyValue,
  updateAttributeValueAPI,
} from '@/store/attributesSlice';
import { useAppDispatch } from '@/store/hooks';
import type {
  Attribute,
  AttributeValue,
  AttributeValueFormData,
  ButtonState,
} from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '@/pages/utils';

type VariationFormState = {
  value: string;
  color: string;
};

type VariationValuePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  type?: string;
  selectedItem?: Attribute;
  editedItem?: AttributeValue | null;
};

const VariationValuePopup = ({
  isOpen,
  onClose,
  type,
  selectedItem,
  editedItem = null,
}: VariationValuePopupProps) => {
  const dispatch = useAppDispatch();
  const [newVariation, setNewVariation] = useState<VariationFormState>({
    value: '',
    color: '',
  });

  useEffect(() => {
    setNewVariation({
      value: editedItem?.value || '',
      color: editedItem?.color || '',
    });
  }, [editedItem]);

  const onTitleChange = (value: unknown) => {
    setNewVariation((prev) => ({
      ...prev,
      value: String(value),
    }));
  };
  const onColorChange = (value: unknown) => {
    setNewVariation((prev) => ({
      ...prev,
      color: String(value),
    }));
  };

  const handleNewValueSave = () => {
    if (editedItem?.id) {
      handleUpdateAttributeValue(newVariation);
    } else {
      handleAddAttributeValue(newVariation);
    }
    setNewVariation({ value: '', color: '' });
    onClose();
  };

  const handleAddAttributeValue = async (v: VariationFormState) => {
    const payload = {
      attribute_id: selectedItem?.id as number,
      value: v?.value,
      color: type === 'color' ? v?.color : null,
    } as AttributeValueFormData;

    try {
      const result = await addAttributeValueAPI(payload);
      handleResult(result, false);
    } catch {
      dispatchToastMessage('error', {
        title: __('Something went wrong', 'kirki-ecommerce'),
      });
    }
  };

  const handleUpdateAttributeValue = async (v: VariationFormState) => {
    const payload = {
      attribute_id: selectedItem?.id as number,
      value_id: editedItem?.id,
      value: v?.value,
      color: type === 'color' ? v?.color : null,
    } as AttributeValueFormData;

    try {
      const result = await updateAttributeValueAPI(payload);
      handleResult(result, true);
    } catch {
      dispatchToastMessage('error', {
        title: __('Something went wrong', 'kirki-ecommerce'),
      });
    }
  };

  const handleResult = (
    result: Awaited<ReturnType<typeof addAttributeValueAPI>>,
    isEdit: boolean,
  ) => {
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      dispatchToastMessage('success', {
        title: isEdit
          ? type === 'color'
            ? __('Color updated', 'kirki-ecommerce')
            : __('Value updated', 'kirki-ecommerce')
          : type === 'color'
            ? __('New color added', 'kirki-ecommerce')
            : __('New value added', 'kirki-ecommerce'),
      });
    } else {
      const errorPayload = result as { message?: string };
      dispatchToastMessage('error', {
        title: errorPayload?.message?.toLowerCase().includes('duplicate')
          ? __('Value already existed', 'kirki-ecommerce')
          : __('Something went wrong', 'kirki-ecommerce'),
      });
    }
  };

  const btnState: ButtonState =
    newVariation?.value === '' ||
    (type === 'color' && newVariation?.color === '')
      ? 'disabled'
      : '';

  return (
    <div>
      <Popover isOpen={isOpen} style={{ width: '365px' }} onClose={onClose}>
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={onClose}
        >
          {type === 'color'
            ? __('Add Color', 'kirki-ecommerce')
            : __('Add Value', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding:
              'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
          }}
        >
          <Flex direction="column" gap={16}>
            <Input
              label={__('Title', 'kirki-ecommerce')}
              placeholder={
                type === 'color'
                  ? __('Cerulean', 'kirki-ecommerce')
                  : __('Add a value', 'kirki-ecommerce')
              }
              onChange={onTitleChange}
              value={newVariation?.value}
            />
            {type === 'color' && (
              <ColorPicker
                value={newVariation?.color}
                onChange={(value) => onColorChange(value)}
                label={__('Color', 'kirki-ecommerce')}
                placeholder={__('#007ba7', 'kirki-ecommerce')}
              />
            )}
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            text={__('Cancel', 'kirki-ecommerce')}
            type="outlined"
            size="small"
            onClick={onClose}
          />
          <Button
            text={__('Save', 'kirki-ecommerce')}
            type="primary"
            size="small"
            state={btnState}
            onClick={handleNewValueSave}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

export default VariationValuePopup;
