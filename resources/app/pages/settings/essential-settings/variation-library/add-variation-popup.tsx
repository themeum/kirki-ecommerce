import { useState } from 'react';

import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { getErrorsObject } from '@/libs/api';
import { useCreateAttributeMutation } from '@/services/attribute';
import type { AttributeFormData, ButtonState, FormErrors } from '@/types';
import { __ } from '@/wpi18n';

type AddVariationPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  variationType: string | null;
};

const AddVariationPopup = ({
  isOpen,
  onClose,
  variationType,
}: AddVariationPopupProps) => {
  const [variationName, setVariationName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const { mutate: createAttribute } = useCreateAttributeMutation();

  const handleAddNewVariation = () => {
    const newAttribute: AttributeFormData = {
      name: variationName,
      type: variationType ?? undefined,
    };
    createAttribute(newAttribute, {
      onSuccess: () => {
        setVariationName('');
        onClose();
      },
      onError: (error) => {
        const errObj = error as { errors?: Record<string, string[]> };
        setErrors(getErrorsObject(errObj.errors));
        setVariationName('');
      },
    });
  };

  const handleClosePopup = () => {
    setVariationName('');
    onClose();
  };

  const buttonState: ButtonState = variationName === '' ? 'disabled' : '';

  return (
    <div>
      <Popover
        isOpen={isOpen}
        style={{ width: '400px' }}
        onClose={handleClosePopup}
      >
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={handleClosePopup}
        >
          {__('Add Variation Name', 'kirki-ecommerce')}
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
              placeholder={__(
                variationType === 'color' ? 'e.g Color' : 'e.g Material',
                'kirki-ecommerce',
              )}
              onChange={(value) => {
                setVariationName(String(value));
                setErrors({ name: '' });
              }}
              error={errors['name'] as string | boolean | undefined}
            />
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            text={__('Cancel', 'kirki-ecommerce')}
            type="outlined"
            size="small"
            onClick={handleClosePopup}
          />
          <Button
            text={__('Save', 'kirki-ecommerce')}
            type="primary"
            size="small"
            state={buttonState}
            onClick={handleAddNewVariation}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

AddVariationPopup.displayName = 'AddVariationPopup';

export default AddVariationPopup;
