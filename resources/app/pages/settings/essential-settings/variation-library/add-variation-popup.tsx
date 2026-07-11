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
import {
  addAttributeAPI,
  setKeyValue,
} from '@/store/attributesSlice';
import { useAppDispatch } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import type { AttributeFormData, ButtonState, FormErrors } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
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
  const dispatch = useAppDispatch();
  const [variationName, setVariationName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const handleAddNewVariation = async () => {
    const newAttribute: AttributeFormData = {
      name: variationName,
      type: variationType ?? undefined,
    };
    const result = await addAttributeAPI(newAttribute);
    if (isApiSuccess(result)) {
      dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      onClose();
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
    setVariationName('');
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

export default AddVariationPopup;
