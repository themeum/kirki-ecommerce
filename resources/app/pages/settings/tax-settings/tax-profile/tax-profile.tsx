import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { BoxClosedIcon, BoxOpenIcon, EditPenIcon, TrashIcon } from '@/icons';
import { toastMutationError } from '@/services/helpers';
import { deleteTaxProfile, useTaxProfilesQuery } from '@/services/tax';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { TaxProfile as TaxProfileType } from '@/types';
import { __ } from '@/wpi18n';

import { TaxProfilePopup } from '@/pages/settings/tax-settings/tax-profile/tax-profile-dialog';

type TaxProfileListItem = TaxProfileType & {
  icon?: ReactNode;
};

const TaxProfile = () => {
  const queryClient = useQueryClient();
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<TaxProfileListItem | null>(null);
  const [taxProfileList, setTaxProfileList] = useState<TaxProfileListItem[]>(
    [],
  );

  const { data: taxProfiles } = useTaxProfilesQuery();

  useEffect(() => {
    const updatedData = (taxProfiles ?? []).map((item) => ({
      ...item,
      icon: <BoxClosedIcon />,
    }));
    setTaxProfileList(updatedData);
  }, [taxProfiles]);

  const handleDeleteTaxProfile = (item: TaxProfileListItem) => {
    const initialList = [...taxProfileList];

    setTaxProfileList((prev) =>
      prev.filter((profile) => profile?.id !== item?.id),
    );
    toast(__('Tax profile deleted', 'kirki-ecommerce'), {
      duration: 5000,
      action: {
        label: __('Undo', 'kirki-ecommerce'),
        onClick: () => {
          setTaxProfileList(initialList);
        },
      },
      onAutoClose: () => {
        deleteTaxProfile(item?.id)
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: ['TaxProfiles'] });
          })
          .catch((error) => {
            toastMutationError(error);
            setTaxProfileList(initialList);
          });
      },
    });
  };

  const handleEditTaxProfile = (item: TaxProfileListItem) => {
    setEditingProfile(item);
  };

  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
          <HeaderActionsCard
            header={__('Tax Profiles', 'kirki-ecommerce')}
            subHeader={__(
              'Used to create tax rates for different product groups, like heavy items needing higher fees.',
              'kirki-ecommerce',
            )}
            buttonText={__('Create Profile', 'kirki-ecommerce')}
            onAdd={() => setShowPopup(true)}
          />

          {!taxProfileList?.length ? (
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
            <StackedItems>
              {taxProfileList.map((item) => (
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
                        onClick={() => handleDeleteTaxProfile(item)}
                      >
                        <TrashIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={__('Edit', 'kirki-ecommerce')}
                        cssOverride={styles.actionButton}
                        onClick={() => handleEditTaxProfile(item)}
                      >
                        <EditPenIcon />
                      </Button>
                    </ActionGroup>
                  </StackedItemActions>
                </StackedItem>
              ))}
            </StackedItems>
          )}
        </CardContent>
      </Card>
      {showPopup && (
        <TaxProfilePopup
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
        />
      )}
      {editingProfile && (
        <TaxProfilePopup
          isOpen={editingProfile}
          onClose={() => setEditingProfile(null)}
          from="edit"
          taxProfile={editingProfile}
        />
      )}
    </div>
  );
};

TaxProfile.displayName = 'TaxProfile';

export default TaxProfile;

const styles = defineStyles({
  emptyState: {
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  },
  actionButton: {
    padding: theme.spacing[1],
  },
});
