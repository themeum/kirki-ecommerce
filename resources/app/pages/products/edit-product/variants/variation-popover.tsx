import { useState } from 'react';

import Button from '@/molecules/button';
import ColorPicker from '@/molecules/color-picker';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import type { ButtonState } from '@/types';
import { __ } from '@/wpi18n';

type VariationFormData = {
  title?: string;
  value?: string;
  color?: string;
};

type VariationPopoverProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (variation: VariationFormData) => void;
};

const VariationPopover = ({
  isOpen,
  onClose = () => {},
  onSave = () => {},
}: VariationPopoverProps) => {
  const [newVariation, setNewVariation] = useState<VariationFormData>({
    title: '',
    value: '',
    color: '',
  });
  const onTitleChange = (value: string | number) => {
    setNewVariation((prev) => ({
      ...prev,
      title: String(value),
      value: String(value),
    }));
  };
  const onColorChange = (value: string) => {
    setNewVariation((prev) => ({
      ...prev,
      color: value,
    }));
  };
  const handleNewValueSave = () => {
    onSave(newVariation);
    setNewVariation({});
    onClose();
  };

  const btnState: ButtonState =
    newVariation?.value === '' || newVariation?.color === '' ? 'disabled' : '';

  return (
    <Popover isOpen={isOpen} style={{ width: '365px' }} onClose={onClose}>
      <PopoverHeader style={{ padding: '20px' }} onClose={onClose}>
        {__('Add Color', 'kirki-ecommerce')}
      </PopoverHeader>
      <PopoverBody style={{ padding: '0 20px 20px 20px' }}>
        <Flex direction="column" gap={16}>
          <Input
            label={__('Title', 'kirki-ecommerce')}
            placeholder={__('Cerulean', 'kirki-ecommerce')}
            onChange={onTitleChange}
            value={newVariation.title}
          />
          <ColorPicker
            value={newVariation.color}
            onChange={(value) => onColorChange(value)}
            label={__('Color', 'kirki-ecommerce')}
            placeholder={__('#007ba7', 'kirki-ecommerce')}
          />
        </Flex>
      </PopoverBody>
      <PopoverFooter style={{ padding: '20px' }}>
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
  );
};

export default VariationPopover;
