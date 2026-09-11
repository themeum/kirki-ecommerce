import { Box } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
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
import AddVariationPopover from '@/features/settings/essentials/pages/variation-library/add-variation-popover';
import StackedListSkeleton from '@/features/settings/skeletons/stacked-list-skeleton';
import { BoxIcon, ColorPaletteIcon, EditPenIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { dispatchToastMessage } from '@/utils/common';
import { __, _n, sprintf } from '@/wpi18n';

type AttributeListItem = Attribute & {
  badge1?: string;
  icon?: ReactNode;
};

const getVariationEditLink = (item: AttributeListItem) => {
  const EssentialsRoutes = RouteConfig.Settings.get('EssentialsSettings');

  if (item?.type === 'color') {
    return EssentialsRoutes.get('ColorVariation').buildLink({ id: item.id });
  }

  return EssentialsRoutes.get('ListVariation').buildLink({ id: item.id });
};

const VariationList = () => {
  const navigate = useNavigate();
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
    void navigate(getVariationEditLink(item));
  };

  return (
    <Card data-search-id="essentials.variation-library" data-search-keywords="size, swatch, option set, attribute term" cssOverride={cardStyles.formCard}>
      <CardContent>
        <CardTitle>
          <Flex align="center" justify="space-between">
            {__('Variation Library', 'kirki-ecommerce')}
            <AddVariationPopover onClose={() => void refetch()} />
          </Flex>
        </CardTitle>
        <CardDescription>
          {__(
            'Create reusable color and list attributes that products use to build variants.',
            'kirki-ecommerce',
          )}
        </CardDescription>
        <div css={scoped({ marginTop: theme.spacing[5] })}>
          {isLoading ? (
            <StackedListSkeleton />
          ) : !attributeListArr.length ? (
            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                <Flex direction="column" gap={2} align="center">
                  <Box />
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
                      <Flex gap={2} align="center">
                        <Link to={getVariationEditLink(item)} css={scoped(styles.nameLink)}>
                          <Text variant="small" weight="medium">
                            {item.name}
                          </Text>
                        </Link>
                        <Badge variant="secondary">
                          {sprintf(
                            _n(
                              '%d value',
                              '%d values',
                              item.values?.length ?? 0,
                              'kirki-ecommerce',
                            ),
                            item.values?.length ?? 0,
                          )}
                        </Badge>
                      </Flex>
                    </StackedItemTitle>
                  </StackedItemContent>
                  <StackedItemActions>
                    <ActionGroup>
                      <Button
                        variant="tertiary"
                        size="icon-sm"
                        aria-label={__('Delete', 'kirki-ecommerce')}
                        cssOverride={styles.actionButton}
                        onClick={() => handleDeleteVariation(item)}
                      >
                        <TrashIcon />
                      </Button>
                      <Button
                        variant="tertiary"
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
  nameLink: {
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});
