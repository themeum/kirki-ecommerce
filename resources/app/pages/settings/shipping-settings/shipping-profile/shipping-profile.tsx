import { useState, useEffect, type ReactNode } from 'react';

import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { BoxClosedIcon, BoxOpenIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
import GroupOptionCard from '@/components/group-option-card';
import HeaderActionsCard from '@/components/header-actions-card';
import { queryClient } from '@/libs/query-client';
import {
  deleteShippingProfile,
  useShippingProfilesQuery,
} from '@/services/shipping';
import { dispatchToastMessage } from '@/pages/utils';
import type { ShippingProfile as ShippingProfileType } from '@/types';
import { __ } from '@/wpi18n';

import { CreateProfilePopup } from '@/pages/settings/shipping-settings/shipping-profile/create-profile-popup';

type ShippingProfileListItem = ShippingProfileType & {
  icon?: ReactNode;
};

const ShippingProfile = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [editProfileIndex, setEditProfileIndex] = useState<number | null>(null);
  const [shippingProfileList, setShippingProfileList] = useState<
    ShippingProfileListItem[]
  >([]);

  const { data: shippingProfiles = [] } = useShippingProfilesQuery({
    limit: -1,
  });

  useEffect(() => {
    const updatedData = shippingProfiles.map((item) => ({
      ...item,
      icon: <BoxClosedIcon />,
    }));
    setShippingProfileList(updatedData);
  }, [shippingProfiles]);

  const handleEditShippingProfile = (item: ShippingProfileListItem) => {
    setEditProfileIndex(item?.id as number);
    setShowPopup(true);
  };

  const handleDeleteShippingProfile = (item: ShippingProfileListItem) => {
    const initialList = [...shippingProfileList];
    setShippingProfileList((prev) =>
      prev.filter((profile) => profile.id !== item.id),
    );

    dispatchToastMessage('delete', {
      title: __('Shipping profile deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setShippingProfileList(initialList);
      },
      onSuccess: async () => {
        await deleteShippingProfile(item?.id);
        void queryClient.invalidateQueries({ queryKey: ['ShippingProfiles'] });
      },
    });
  };

  return (
    <>
      <Card type="large">
        <HeaderActionsCard
          header={__('Shipping Profiles', 'kirki-ecommerce')}
          subHeader={__(
            'Used to create shipping rates for different product groups, like heavy items needing higher fees.',
            'kirki-ecommerce',
          )}
          buttonText={__('Create Profile', 'kirki-ecommerce')}
          onAdd={() => setShowPopup(true)}
        />

        {!shippingProfileList?.length ? (
          <Card
            type="innerDark"
            style={{ padding: 'var(--decom-spacing-9) var(--decom-spacing-0)' }}
          >
            <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
              <BoxOpenIcon />
              <span style={{ color: 'var(--decom-text-text-subdued)' }}>
                {__(
                  'Added shipping profiles will appear here',
                  'kirki-ecommerce',
                )}
              </span>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
            <GroupOptionCard
              dataArr={shippingProfileList}
              handleDeleteItem={(item) =>
                handleDeleteShippingProfile(item as ShippingProfileListItem)
              }
              handleEditItem={(item) =>
                handleEditShippingProfile(item as ShippingProfileListItem)
              }
            />
          </Flex>
        )}
      </Card>
      {showPopup && (
        <CreateProfilePopup
          isOpen={showPopup}
          onClose={() => {
            setShowPopup(false);
            setEditProfileIndex(null);
          }}
          shippingProfileList={shippingProfileList}
          editIndex={editProfileIndex}
        />
      )}
    </>
  );
};

ShippingProfile.displayName = 'ShippingProfile';

export default ShippingProfile;
