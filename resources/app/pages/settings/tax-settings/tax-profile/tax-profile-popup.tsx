import { useEffect, useState } from 'react';

import Input from '@/molecules/input';
import Button from '@/molecules/button';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';

import {
  useCreateTaxProfileMutation,
  useUpdateTaxProfileMutation,
} from '@/services/tax';
import type { TaxProfile } from '@/types';
import { __ } from '@/wpi18n';

type TaxProfilePopupProps = {
  isOpen: boolean | TaxProfile;
  onClose?: () => void;
  onSave?: (id: number) => void;
  from?: string;
  taxProfile?: TaxProfile | null;
};

export const TaxProfilePopup = ({
  isOpen,
  onClose = () => {},
  onSave = () => {},
  from = '',
  taxProfile = null,
}: TaxProfilePopupProps) => {
  const [profileTitle, setProfileTitle] = useState('');
  const { mutate: createTaxProfile } = useCreateTaxProfileMutation();
  const { mutate: updateTaxProfile } = useUpdateTaxProfileMutation();

  useEffect(() => {
    if (taxProfile) {
      setProfileTitle(taxProfile?.name);
    }
  }, []);

  const AddOrUpdateTaxProfile = () => {
    const data = {
      name: profileTitle,
    };

    if (from === 'edit') {
      updateTaxProfile(
        { id: taxProfile?.id as number, data },
        {
          onSuccess: (response) => {
            onSave((response.data as { id: number })?.id);
            handleOnPopupClose();
          },
        },
      );
      return;
    }

    createTaxProfile(data, {
      onSuccess: (response) => {
        onSave((response.data as { id: number })?.id);
        handleOnPopupClose();
      },
    });
  };

  const handleOnPopupClose = () => {
    setProfileTitle('');
    onClose();
  };
  const buttonState = profileTitle === '';
  return (
    <div>
      <Popover isOpen={!!isOpen} style={{ width: '400px' }}>
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={handleOnPopupClose}
        >
          {__('Create tax profile', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding:
              'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
          }}
        >
          <Input
            label={__('Title', 'kirki-ecommerce')}
            placeholder={__('e.g. Books', 'kirki-ecommerce')}
            value={profileTitle}
            onChange={(value: string | number) =>
              setProfileTitle(String(value))
            }
          />
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__('Cancel', 'kirki-ecommerce')}
            size="small"
            onClick={handleOnPopupClose}
          />
          <Button
            type="primary"
            text={
              from === 'edit'
                ? __('Update', 'kirki-ecommerce')
                : __('Save', 'kirki-ecommerce')
            }
            size="small"
            onClick={AddOrUpdateTaxProfile}
            state={buttonState ? 'disabled' : ''}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

TaxProfilePopup.displayName = 'TaxProfilePopup';
