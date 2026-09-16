import { type ReactNode, useEffect, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
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
import { TaxProfilePopup } from '@/features/settings/tax/shared/components/tax-profile/tax-profile-dialog';
import { TaxProfilePopover } from '@/features/settings/tax/shared/components/tax-profile/tax-profile-popover';
import type { TaxProfile as TaxProfileType } from '@/features/settings/tax/shared/schemas/catalog/tax';
import {
  useDeleteTaxProfileMutation,
  useTaxProfilesQuery,
} from '@/features/settings/tax/shared/services/tax';
import { useConfirmDelete } from '@/hooks';
import { BoxClosedIcon, BoxOpenIcon, EditPenIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type TaxProfileListItem = TaxProfileType & {
  icon?: ReactNode;
};

const TaxProfile = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfile, setEditingProfile] = useState<TaxProfileListItem | null>(null);
  const [taxProfileList, setTaxProfileList] = useState<TaxProfileListItem[]>([]);

  const { data: taxProfiles } = useTaxProfilesQuery();
  const { mutate: deleteTaxProfile } = useDeleteTaxProfileMutation();

  useEffect(() => {
    const updatedData = (taxProfiles ?? []).map((item) => ({
      ...item,
      icon: <BoxClosedIcon />,
    }));
    setTaxProfileList(updatedData);
  }, [taxProfiles]);

  const { confirmDelete, deleteConfirmation } = useConfirmDelete();

  const handleDeleteTaxProfile = (item: TaxProfileListItem) => {
    confirmDelete(
      {
        title: __('Delete tax profile?', 'kirki-ecommerce'),
        description: __(
          'This tax profile will be permanently deleted and no longer applied to your products. This cannot be undone.',
          'kirki-ecommerce',
        ),
      },
      () => {
        deleteTaxProfile(item?.id);
      },
    );
  };

  const handleEditTaxProfile = (item: TaxProfileListItem) => {
    setEditingProfile(item);
  };

  return (
    <div>
      <Card
        data-search-id="tax.profile"
        data-search-keywords="vat rate, gst rate, tax class, levy"
        cssOverride={cardStyles.formCard}
      >
        <CardContent>
          <TaxProfilePopover isOpen={showPopup} onClose={() => setShowPopup(false)}>
            <HeaderActionsCard
              header={__('Tax Profiles', 'kirki-ecommerce')}
              subHeader={__(
                'Rate groups for products taxed differently, such as food, books or digital goods.',
                'kirki-ecommerce',
              )}
              buttonText={__('Add', 'kirki-ecommerce')}
              onAdd={() => setShowPopup(true)}
            />
          </TaxProfilePopover>

          <div css={scoped({ marginTop: theme.spacing[5] })}>
            {!taxProfileList?.length ? (
              <Card cssOverride={cardStyles.innerDarkCard}>
                <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                  <Flex direction="column" gap={2} align="center">
                    <BoxOpenIcon />
                    <span css={scoped(styles.emptyStateText)}>
                      {__('Added shipping profiles will appear here', 'kirki-ecommerce')}
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
                          cssOverride={mergeCss(styles.actionButton, {
                            '& svg': { color: theme.colors.icon.critical },
                          })}
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
          </div>
        </CardContent>
      </Card>
      {editingProfile && (
        <TaxProfilePopup
          isOpen={editingProfile}
          onClose={() => setEditingProfile(null)}
          from="edit"
          taxProfile={editingProfile}
        />
      )}
      {deleteConfirmation}
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
