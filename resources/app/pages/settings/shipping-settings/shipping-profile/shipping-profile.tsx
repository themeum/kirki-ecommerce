import { useEffect, useState, type ReactNode } from 'react';

import GroupOptionCard from '@/components/group-option-card';
import HeaderActionsCard from '@/components/header-actions-card';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { BoxClosedIcon, BoxOpenIcon } from '@/icons';
import { queryClient } from '@/libs/query-client';
import { dispatchToastMessage } from '@/pages/utils';
import { useSettingsQuery } from '@/services/settings';
import { deleteShippingProfile, useShippingProfilesQuery } from '@/services/shipping';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { ShippingProfile as ShippingProfileType } from '@/types';
import { __, sprintf } from '@/wpi18n';

import { CreateProfilePopup } from '@/pages/settings/shipping-settings/shipping-profile/create-profile-dialog';
import type { ShippingZone } from '@/pages/settings/shipping-settings/utils';

type ShippingProfileListItem = ShippingProfileType & {
  icon?: ReactNode;
  badge1?: string;
  badge2?: string;
};

const getProfileUsage = (profileName: string, zones: ShippingZone[]) => {
  const zonesUsingProfile = new Set<string | number>();
  let ruleCount = 0;

  zones.forEach((zone) => {
    zone.shipping_methods?.forEach((method) => {
      method.shipping_rules?.forEach((rule) => {
        const referencesProfile = rule.conditions?.some(
          (condition) => condition.type === 'shipping_profile' && condition.value === profileName,
        );
        if (referencesProfile) {
          ruleCount += 1;
          zonesUsingProfile.add(zone.id);
        }
      });
    });
  });

  return { ruleCount, zoneCount: zonesUsingProfile.size };
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
  const { data: shippingSettingsData } = useSettingsQuery('shipping');

  useEffect(() => {
    const zones = (shippingSettingsData?.shipping_zones as ShippingZone[]) || [];
    const updatedData = shippingProfiles.map((item) => {
      const { ruleCount, zoneCount } = getProfileUsage(item.name, zones);
      return {
        ...item,
        icon: <BoxClosedIcon />,
        badge1: ruleCount > 0 ? sprintf(__('%d Rules', 'kirki-ecommerce'), ruleCount) : undefined,
        badge2: zoneCount > 0 ? sprintf(__('In Use: %d Zones', 'kirki-ecommerce'), zoneCount) : undefined,
      };
    });
    setShippingProfileList(updatedData);
  }, [shippingProfiles, shippingSettingsData]);

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
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
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
            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                <Flex direction="column" gap={2} align="center">
                  <BoxOpenIcon />
                  <span css={scoped(styles.emptyStateText)}>
                    {__(
                      'Added shipping profiles will appear here',
                      'kirki-ecommerce',
                    )}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <Flex direction="column" data-box-wrapper cssOverride={styles.boxWrapper}>
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

const styles = defineStyles({
  boxWrapper: {
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
  },
  emptyState: {
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  }
});
