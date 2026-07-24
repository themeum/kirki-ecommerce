import { useState, useEffect, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { BoxClosedIcon, BoxOpenIcon } from '@/icons';
import GroupOptionCard from '@/components/group-option-card';
import HeaderActionsCard from '@/components/header-actions-card';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { queryClient } from '@/libs/query-client';
import {
  deleteShippingProfile,
  useShippingProfilesQuery,
} from '@/services/shipping';
import { dispatchToastMessage } from '@/pages/utils';
import type { ShippingProfile as ShippingProfileType } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { CreateProfilePopup } from '@/pages/settings/shipping-settings/shipping-profile/create-profile-dialog';

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
      <Card css={cardStyles.largeCard}>
        <CardContent css={cardStyles.largeContentPadded}>
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
            <Card css={cardStyles.innerDarkCard}>
              <CardContent css={[cardStyles.innerDarkContent, styles.emptyState]}>
                <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
                  <BoxOpenIcon />
                  <span css={styles.emptyStateText}>
                    {__(
                      'Added shipping profiles will appear here',
                      'kirki-ecommerce',
                    )}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <Flex direction="column" data-box-wrapper css={styles.boxWrapper}>
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
        </CardContent>
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

const styles = {
  boxWrapper: scoped({
    '[data-box-card]': {
      borderTop: 'none',
      borderRadius: theme.radius.none,
    },
    '[data-box-card]:first-of-type': {
      borderTop: `1px solid ${theme.colors.border.secondary}`,
      borderRadius: `${theme.radius.md} ${theme.radius.md} ${theme.radius.none} ${theme.radius.none}`,
    },
    '[data-box-card]:last-of-type': {
      borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.md} ${theme.radius.md}`,
    },
  }),
  emptyState: scoped({
    padding: `${theme.spacing['7xl']} ${theme.spacing.none}`,
  }),
  emptyStateText: scoped({
    color: theme.colors.text.subdued,
  })
};
