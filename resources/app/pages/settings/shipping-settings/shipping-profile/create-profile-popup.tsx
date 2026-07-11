import { useState, useEffect } from 'react';

import Input from '@/molecules/input';
import Button from '@/molecules/button';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';

import {
  createShippingProfile,
  updateShippingProfileById,
  setKeyValue,
} from '@/store/settingsSlice';
import { useAppDispatch } from '@/store/hooks';
import { dispatchToastMessage } from '@/pages/utils';
import type { ShippingProfile } from '@/types';
import { isApiSuccess } from '@/types';
import { __ } from '@/wpi18n';

type CreateProfilePopupProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (id: number) => void;
  fetchProfileList?: () => void;
  editIndex?: number | null;
  shippingProfileList: ShippingProfile[];
};

export const CreateProfilePopup = ({
  isOpen,
  onClose = () => {},
  onSave = () => {},
  editIndex = null,
  shippingProfileList,
}: CreateProfilePopupProps) => {
  const dispatch = useAppDispatch();
  const [profileTitle, setProfileTitle] = useState('');

  useEffect(() => {
    if (editIndex) {
      const selectedProfile = shippingProfileList.find(
        (profile) => profile?.id === editIndex,
      );
      setProfileTitle(selectedProfile?.name ?? '');
    }
  }, [editIndex]);

  const AddOrUpdateShippingProfile = async () => {
    if (!profileTitle.trim()) {
      return;
    }

    const data = { name: profileTitle };
    let result;

    if (editIndex) {
      const selectedProfile = shippingProfileList.find(
        (profile) => profile?.id === editIndex,
      );
      if (!selectedProfile) {
        return;
      }
      result = await updateShippingProfileById(selectedProfile.id, data);
    } else {
      result = await createShippingProfile(data);
    }

    if (isApiSuccess(result)) {
      dispatch(
        setKeyValue({
          key: 'toggler',
          value: Date.now(),
          nestedToggler: ['shipping', 'shippingProfile'],
        }),
      );
      onSave((result.data as { id?: number }).id as number);
      dispatchToastMessage('success', {
        title: editIndex
          ? __('Shipping profile updated', 'kirki-ecommerce')
          : __('Shipping profile created', 'kirki-ecommerce'),
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
      <Popover isOpen={isOpen} style={{ width: '400px' }}>
        <PopoverHeader
          style={{ padding: 'var(--decom-spacing-5)' }}
          onClose={handleOnPopupClose}
        >
          {__('Create shipping profile', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding:
              'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
          }}
        >
          <Input
            label={__('Title', 'kirki-ecommerce')}
            placeholder={__('e.g. Fragile', 'kirki-ecommerce')}
            value={profileTitle}
            onChange={(value) => setProfileTitle(String(value))}
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
            text={__('Save', 'kirki-ecommerce')}
            size="small"
            onClick={AddOrUpdateShippingProfile}
            state={buttonState ? 'disabled' : ''}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};
