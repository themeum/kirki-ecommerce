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
  useCreateAttributeValueMutation,
  useUpdateAttributeValueMutation,
} from '@/services/attribute';
import type {
  Attribute,
  AttributeValue,
  AttributeValueFormData,
  ButtonState,
} from '@/types';
import { __ } from '@/wpi18n';

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
  const createMutation = useCreateAttributeValueMutation();
  const updateMutation = useUpdateAttributeValueMutation();
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
  };

  const handleAddAttributeValue = (v: VariationFormState) => {
    const payload = {
      attribute_id: selectedItem?.id as number,
      value: v?.value,
      color: type === 'color' ? v?.color : null,
    } as AttributeValueFormData;

    createMutation.mutate(payload, {
      onSuccess: () => {
        setNewVariation({ value: '', color: '' });
        onClose();
      },
    });
  };

  const handleUpdateAttributeValue = (v: VariationFormState) => {
    const payload = {
      attribute_id: selectedItem?.id as number,
      value_id: editedItem?.id,
      value: v?.value,
      color: type === 'color' ? v?.color : null,
    } as AttributeValueFormData;

    updateMutation.mutate(payload, {
      onSuccess: () => {
        setNewVariation({ value: '', color: '' });
        onClose();
      },
    });
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

VariationValuePopup.displayName = 'VariationValuePopup';

export default VariationValuePopup;
