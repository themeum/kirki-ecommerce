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
  useCreateShippingProfileMutation,
  useUpdateShippingProfileMutation,
} from '@/services/shipping';
import type { ShippingProfile } from '@/types';
import { __ } from '@/wpi18n';

type CreateProfilePopupProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (id: number) => void;
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
  const [profileTitle, setProfileTitle] = useState('');

  const { mutate: createProfile } = useCreateShippingProfileMutation();
  const { mutate: updateProfile } = useUpdateShippingProfileMutation();

  useEffect(() => {
    if (editIndex) {
      const selectedProfile = shippingProfileList.find(
        (profile) => profile?.id === editIndex,
      );
      setProfileTitle(selectedProfile?.name ?? '');
    }
  }, [editIndex]);

  const handleAddOrUpdateShippingProfile = () => {
    if (!profileTitle.trim()) {
      return;
    }

    const data = { name: profileTitle };

    if (editIndex) {
      const selectedProfile = shippingProfileList.find(
        (profile) => profile?.id === editIndex,
      );
      if (!selectedProfile) {
        return;
      }
      updateProfile(
        { id: selectedProfile.id, data },
        {
          onSuccess: (response) => {
            onSave((response.data as { id?: number })?.id as number);
            handleOnPopupClose();
          },
        },
      );
    } else {
      createProfile(data, {
        onSuccess: (response) => {
          onSave((response.data as { id?: number })?.id as number);
          handleOnPopupClose();
        },
      });
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
            onClick={handleAddOrUpdateShippingProfile}
            state={buttonState ? 'disabled' : ''}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};
