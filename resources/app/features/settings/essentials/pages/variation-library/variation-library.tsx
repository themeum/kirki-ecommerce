import { type ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

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
import { RouteConfig } from '@/config/route-config';
import type { Attribute } from '@/features/products';
import { useAttributesQuery, useDeleteAttributeMutation } from '@/features/products';
import AddVariationPopup from '@/features/settings/essentials/pages/variation-library/add-variation-dialog';
import StackedListSkeleton from '@/features/settings/skeletons/stacked-list-skeleton';
import { BoxIcon, ColorPaletteIcon, EditPenIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { dispatchToastMessage } from '@/utils/common';
import { __ } from '@/wpi18n';

type AttributeListItem = Attribute & {
  badge1?: string;
  icon?: ReactNode;
};

const VariationList = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [variationType, setVariationType] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<number[]>([]);

  const { data: attributeList = [], isLoading, refetch } = useAttributesQuery({ limit: -1 });
  const { mutate: deleteAttribute } = useDeleteAttributeMutation();

  const attributeListArr = useMemo<AttributeListItem[]>(
    () =>
      attributeList
        .filter((item) => !removedIds.includes(item.id))
        .map((item) => ({
          ...item,
          badge1: `${item.values?.length ?? 0} values`,
          icon: item.type === 'color' ? <ColorPaletteIcon /> : <BoxIcon />,
        })),
    [attributeList, removedIds],
  );

  const handleDeleteVariation = (item: AttributeListItem) => {
    setRemovedIds((prev) => [...prev, item.id]);
    dispatchToastMessage('delete', {
      title: __('Attribute deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setRemovedIds((prev) => prev.filter((id) => id !== item.id));
      },
      onSuccess: () => {
        deleteAttribute(item.id, { onSuccess: () => refetch() });
      },
    });
  };

  const handleEditVariation = (item: AttributeListItem) => {
    const EssentialsRoutes = RouteConfig.Settings.get('EssentialsSettings');

    if (item?.type === 'color') {
      void navigate(EssentialsRoutes.get('ColorVariation').buildLink({ id: item.id }));
    } else {
      void navigate(EssentialsRoutes.get('ListVariation').buildLink({ id: item.id }));
    }
  };

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardContent >
        <HeaderActionsCard
          header={__('Variation Library', 'kirki-ecommerce')}
          subHeader={__(
            'Used to create tax rates for different product groups, like heavy items needing higher fees.',
            'kirki-ecommerce',
          )}
          dropDownButton
          buttonText={__('Add Variation', 'kirki-ecommerce')}
          handleOptionSelect={(value) => {
            setVariationType(String(value));
            setShowPopup(true);
          }}
        />
        <div css={scoped({ marginTop: theme.spacing[5] })}>
          {isLoading ? (
            <StackedListSkeleton />
          ) : !attributeListArr.length ? (
            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                <Flex direction="column" gap={2} align="center">
                  <BoxIcon />
                  <span css={scoped(styles.emptyStateText)}>
                    {__('Added variation library will appear here', 'kirki-ecommerce')}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <StackedItems>
              {attributeListArr.map((item) => (
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
                        onClick={() => handleDeleteVariation(item)}
                      >
                        <TrashIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={__('Edit', 'kirki-ecommerce')}
                        cssOverride={styles.actionButton}
                        onClick={() => handleEditVariation(item)}
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
        <AddVariationPopup
          isOpen={showPopup}
          variationType={variationType}
          onClose={() => {
            setShowPopup(false);
            void refetch();
          }}
        />
      </CardContent>
    </Card>
  );
};

VariationList.displayName = 'VariationList';

export default VariationList;

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
