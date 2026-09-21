import { Box, Package } from 'lucide-react';
import { useMemo, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
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
import { CreateProfilePopup } from '@/features/settings/shipping/pages/shipping-profile/create-profile-dialog';
import { CreateProfilePopover } from '@/features/settings/shipping/pages/shipping-profile/create-profile-popover';
import type { ShippingProfile as ShippingProfileType } from '@/features/settings/shipping/schemas/catalog/shipping';
import {
  useDeleteShippingProfileMutation,
  useShippingProfilesQuery,
} from '@/features/settings/shipping/services/shipping';
import { useConfirmDelete } from '@/hooks';
import { EditPenIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const SHIPPING_PROFILES_PARAMS = { limit: -1 };

const ShippingProfile = () => {
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [editProfileIndex, setEditProfileIndex] = useState<number | null>(null);

  const { data: shippingProfiles = [] } = useShippingProfilesQuery(SHIPPING_PROFILES_PARAMS);
  const { mutate: deleteShippingProfile } = useDeleteShippingProfileMutation();

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
  };

  const { confirmDelete, deleteConfirmation } = useConfirmDelete();

  const handleDeleteShippingProfile = (item: ShippingProfileType) => {
    confirmDelete(
      {
        title: __('Delete shipping profile?', 'kirki-ecommerce'),
        description: __(
          'This shipping profile will be permanently deleted. This cannot be undone.',
          'kirki-ecommerce',
        ),
      },
      () => {
        deleteShippingProfile(item?.id);
      },
    );
  };

  return (
    <>
      <Card
        data-search-id="shipping.profiles"
        data-search-keywords="rate, postage, carrier, courier, delivery charge"
        cssOverride={cardStyles.formCard}
      >
        <CardContent>
          <CreateProfilePopover isOpen={showAddPopover} onClose={() => setShowAddPopover(false)}>
            <HeaderActionsCard
              header={__('Shipping Profiles', 'kirki-ecommerce')}
              subHeader={__(
                'Rate groups for products that ship differently, such as bulky or heavy items.',
                'kirki-ecommerce',
              )}
              buttonText={__('Add', 'kirki-ecommerce')}
              onAdd={() => setShowAddPopover(true)}
            />
          </CreateProfilePopover>

          {!shippingProfileList?.length ? (
            <EmptyState
              icon={<Box color={theme.colors.icon.secondary} />}
              text={__('Added shipping profiles will appear here', 'kirki-ecommerce')}
              cssOverride={{ marginTop: theme.spacing[3] }}
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
                        {item.is_default && (
                          <Badge variant="secondary">{__('Default', 'kirki-ecommerce')}</Badge>
                        )}
                      </StackedItemTitle>
                    </StackedItemContent>
                    <StackedItemActions>
                      <ActionGroup>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={__('Delete', 'kirki-ecommerce')}
                          cssOverride={styles.actionButton}
                          onClick={() => handleDeleteShippingProfile(item)}
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
        isOpen={editProfileIndex !== null}
        onClose={() => setEditProfileIndex(null)}
        shippingProfileList={shippingProfileList}
        editIndex={editProfileIndex}
      />
      {deleteConfirmation}
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
