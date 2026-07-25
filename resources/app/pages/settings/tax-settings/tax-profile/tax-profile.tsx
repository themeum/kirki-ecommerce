import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import GroupOptionCard from '@/components/group-option-card';
import HeaderActionsCard from '@/components/header-actions-card';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { BoxClosedIcon, BoxOpenIcon } from '@/icons';
import { toastMutationError } from '@/services/helpers';
import { deleteTaxProfile, useTaxProfilesQuery } from '@/services/tax';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';
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
      <Card css={cardStyles.largeCard}>
        <CardContent css={cardStyles.largeContentPadded}>
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
            <Card css={cardStyles.innerDarkCard}>
              <CardContent css={[cardStyles.innerDarkContent, styles.emptyState]}>
                <Flex direction="column" gap={2} align="center">
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
                dataArr={taxProfileList}
                handleDeleteItem={(item) =>
                  handleDeleteTaxProfile(item as TaxProfileListItem)
                }
                handleEditItem={(item) =>
                  handleEditTaxProfile(item as TaxProfileListItem)
                }
              />
            </Flex>
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
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  }),
  emptyStateText: scoped({
    color: theme.colors.text.subdued,
  })
};
