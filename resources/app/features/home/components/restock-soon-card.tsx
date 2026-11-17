import type { UseQueryResult } from '@tanstack/react-query';
import { Link } from 'react-router';

import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import QueryErrorState from '@/components/ui/query-error-state';
import {
  StackedItem,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import OverviewCard from '@/features/home/components/overview-card';
import SkeletonLine from '@/features/home/components/skeleton-line';
import type { DashboardAttention } from '@/features/home/schemas/catalog/dashboard-attention';
import { InventoryEmptyStateIcon } from '@/icons/empty-state';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const IMAGE_SIZE = '42px';
const LOADING_ROW_COUNT = 5;

type RestockSoonCardProps = {
  query: UseQueryResult<DashboardAttention>;
  onHide: () => void;
};

const RestockSoonCard = (props: RestockSoonCardProps) => {
  const { query, onHide } = props;
  const items = query.data?.low_stock.items;

  return (
    <OverviewCard
      title={__('Restock soon', 'kirki-ecommerce')}
      info={__(
        'Tracked variants at or under their low-stock threshold that still have stock. Restock them before they sell out.',
        'kirki-ecommerce',
      )}
      actionLabel={__('View inventory', 'kirki-ecommerce')}
      actionTo={`${RouteConfig.Inventory.buildLink()}?inventory_type=low_stock`}
      onHide={onHide}
    >
      {query.isError ? (
        <div css={scoped(styles.body)}>
          <QueryErrorState onRetry={() => void query.refetch()} isRetrying={query.isFetching} />
        </div>
      ) : items === undefined ? (
        <div css={scoped(styles.body)}>
          <StackedItems>
            {Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
              <StackedItem key={index} id={String(index)} cssOverride={styles.item}>
                <SkeletonLine width="70%" lineHeight="48px" />
              </StackedItem>
            ))}
          </StackedItems>
        </div>
      ) : items.length === 0 ? (
        <Flex direction="column" align="center" cssOverride={styles.empty}>
          <InventoryEmptyStateIcon />
          <Text color="subdued">{__('Nothing is low on stock.', 'kirki-ecommerce')}</Text>
        </Flex>
      ) : (
        <div css={scoped(styles.body)}>
          <StackedItems>
            {items.map((item) => (
              <StackedItem
                key={item.variant_id}
                id={String(item.variant_id)}
                cssOverride={styles.item}
              >
                <Link
                  to={RouteConfig.Inventory.get('EditInventory').buildLink({ id: item.variant_id })}
                  css={scoped(styles.row)}
                >
                  <StackedItemMedia>
                    <Image
                      src={item.image}
                      alt={item.product_name}
                      width={IMAGE_SIZE}
                      height={IMAGE_SIZE}
                      fit="cover"
                    />
                  </StackedItemMedia>
                  <StackedItemContent cssOverride={styles.details}>
                    <Text variant="small" weight="medium" color="primary" truncate>
                      {item.product_name}
                    </Text>
                    {item.variant_name && (
                      <Text variant="tiny" color="secondary" truncate>
                        {item.variant_name}
                      </Text>
                    )}
                  </StackedItemContent>
                  <Text variant="tiny" color="secondary" cssOverride={styles.left}>
                    {sprintf(
                      /* translators: %d: number of units left in stock */
                      __('%d left', 'kirki-ecommerce'),
                      item.available_quantity,
                    )}
                  </Text>
                </Link>
              </StackedItem>
            ))}
          </StackedItems>
        </div>
      )}
    </OverviewCard>
  );
};

RestockSoonCard.displayName = 'RestockSoonCard';

export default RestockSoonCard;

const styles = defineStyles({
  body: {
    padding: `0 ${theme.spacing[3]} ${theme.spacing[6]} ${theme.spacing[3]}`,
  },
  item: {
    height: 'auto',
    padding: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[3],
    width: '100%',
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    boxSizing: 'border-box',
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: theme.colors.background.fillHover,
    },
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  left: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing[2],
    padding: theme.spacing[6],
  },
});
