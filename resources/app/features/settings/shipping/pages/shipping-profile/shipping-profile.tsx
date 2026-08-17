import { Package } from 'lucide-react';
import { useMemo, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { shippingKeys } from '@/features/settings';
import { CreateProfilePopup } from '@/features/settings/shipping/pages/shipping-profile/create-profile-dialog';
import type { ShippingProfile as ShippingProfileType } from '@/features/settings/shipping/schemas/catalog/shipping';
import { deleteShippingProfile, useShippingProfilesQuery } from '@/features/settings/shipping/services/shipping';
import { BoxOpenIcon, EditPenIcon, TrashIcon } from '@/icons';
import { queryClient } from '@/libs/query-client';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { dispatchToastMessage } from '@/utils/common';
import { __ } from '@/wpi18n';

const SHIPPING_PROFILES_PARAMS = { limit: -1 };

const ShippingProfile = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [editProfileIndex, setEditProfileIndex] = useState<number | null>(null);

  const { data: shippingProfiles = [] } = useShippingProfilesQuery(
    SHIPPING_PROFILES_PARAMS,
  );

  const shippingProfileList = useMemo(() => {
    return shippingProfiles.map((profile) => {
      return {
        ...profile,
        icon: <Package size={16} />,
      };
    });
  }, [shippingProfiles]);

  const handleEditShippingProfile = (item: ShippingProfileType) => {
    setEditProfileIndex(item?.id);
    setShowPopup(true);
  };

  const handleDeleteShippingProfile = async (item: ShippingProfileType) => {
    const queryKey = shippingKeys.profiles.list(SHIPPING_PROFILES_PARAMS);

    await queryClient.cancelQueries({ queryKey });
    const previousProfiles =
      queryClient.getQueryData<ShippingProfileType[]>(queryKey);

    queryClient.setQueryData<ShippingProfileType[]>(queryKey, (profiles) =>
      (profiles ?? []).filter((profile) => profile.id !== item.id),
    );

    dispatchToastMessage('delete', {
      title: __('Shipping profile deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        queryClient.setQueryData(queryKey, previousProfiles);
      },
      onSuccess: async () => {
        await deleteShippingProfile(item?.id);
        void queryClient.invalidateQueries({ queryKey: shippingKeys.profiles.all });
      },
    });
  };

  return (
    <>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
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
            <EmptyState
              icon={<BoxOpenIcon />}
              text={__(
                'Added shipping profiles will appear here',
                'kirki-ecommerce',
              )}
            />
          ) : (
            <div css={scoped({ marginTop: theme.spacing[5] })}>
              <StackedItems>
                {shippingProfileList.map((item) => (
                  <StackedItem key={item.id} id={String(item.id)}>
                    {item.icon && <StackedItemMedia>{item.icon}</StackedItemMedia>}
                    <StackedItemContent>
                      <StackedItemTitle>
                        <Text variant="small" weight="medium">
                          {item.name}
                        </Text>
                      </StackedItemTitle>
                    </StackedItemContent>
                    <StackedItemActions>
                      <ActionGroup>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={__('Delete', 'kirki-ecommerce')}
                          cssOverride={styles.actionButton}
                          onClick={() => void handleDeleteShippingProfile(item)}
                        >
                          <TrashIcon />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={__('Edit', 'kirki-ecommerce')}
                          cssOverride={styles.actionButton}
                          onClick={() => handleEditShippingProfile(item)}
                        >
                          <EditPenIcon />
                        </Button>
                      </ActionGroup>
                    </StackedItemActions>
                  </StackedItem>
                ))}
              </StackedItems>
            </div>
          )}
        </CardContent>
      </Card>
      <CreateProfilePopup
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false);
          setEditProfileIndex(null);
        }}
        shippingProfileList={shippingProfileList}
        editIndex={editProfileIndex}
      />
    </>
  );
};

ShippingProfile.displayName = 'ShippingProfile';

export default ShippingProfile;

const styles = defineStyles({
  actionButton: {
    padding: theme.spacing[1],
  },
});
