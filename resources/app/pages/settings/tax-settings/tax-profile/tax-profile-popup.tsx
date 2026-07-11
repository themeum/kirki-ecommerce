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
  createTaxProfile,
  setKeyValue,
  updateTaxProfileAPI,
} from '@/store/settingsSlice';
import { useAppDispatch } from '@/store/hooks';
import { dispatchToastMessage } from '@/pages/utils';
import type { TaxProfile } from '@/types';
import { isApiSuccess } from '@/types';
import { __ } from '@/wpi18n';

type TaxProfilePopupProps = {
  isOpen: boolean | TaxProfile;
  onClose?: () => void;
  onSave?: (id: number) => void;
  fetchTaxProfileList?: () => void;
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
  const dispatch = useAppDispatch();
  const [profileTitle, setProfileTitle] = useState('');

  useEffect(() => {
    if (taxProfile) {
      setProfileTitle(taxProfile?.name);
    }
  }, []);

  const AddOrUpdateTaxProfile = async () => {
    const data = {
      name: profileTitle,
    };
    const result =
      from === 'edit'
        ? await updateTaxProfileAPI(taxProfile?.id as number, data)
        : await createTaxProfile(data);
    if (isApiSuccess(result)) {
      dispatch(
        setKeyValue({
          key: 'toggler',
          value: Date.now(),
          nestedToggler: ['tax', 'taxProfile'],
        }),
      );
      onSave((result.data as { id: number })?.id);
      dispatchToastMessage('success', {
        title:
          from === 'edit'
            ? __('Tax profile updated', 'kirki-ecommerce')
            : __('Tax profile created', 'kirki-ecommerce'),
      });
      handleOnPopupClose();
    }
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
