import { Link } from 'react-router';

import Flex from '@/components/ui/flex';
import { StackedItem, StackedItems } from '@/components/ui/stacked-items';
import Text, { type TextColor } from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import OverviewCard from '@/features/home/components/overview-card';
import SkeletonLine from '@/features/home/components/skeleton-line';
import { formatTimeAgo } from '@/features/home/lib/relative-time';
import {
  type FulfillmentStatus,
  getFulfillmentBadgeInfo,
  type OrderListItem,
} from '@/features/orders';
import { OrderEmptyStateIcon } from '@/icons/empty-state';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

const FULFILLMENT_TEXT_COLORS: Record<FulfillmentStatus, TextColor> = {
  unfulfilled: 'warning',
  processing: 'special2',
  shipped: 'special3',
  delivered: 'success',
  'on-hold': 'caution',
  cancelled: 'critical',
  returned: 'warning',
};

const LOADING_ROW_COUNT = 5;
const LINE_HEIGHT = '22px';

type RecentOrdersCardProps = {
  orders?: OrderListItem[];
};

const NoOrderState = () => {
  return (
    <Flex direction="column" align="center">
      <OrderEmptyStateIcon />
      <Text color="subdued" cssOverride={styles.empty}>
        {__('No orders yet', 'kirki-ecommerce')}
      </Text>
    </Flex>
  );
};

const RecentOrdersCard = ({ orders }: RecentOrdersCardProps) => {
  return (
    <OverviewCard
      title={__('Recent orders', 'kirki-ecommerce')}
      info={__(
        'Your five newest orders, with any payment status. Select an order to see its details.',
        'kirki-ecommerce',
      )}
      actionLabel={__('View all orders', 'kirki-ecommerce')}
      actionTo={RouteConfig.Orders.buildLink()}
    >
      {orders === undefined ? (
        <div css={scoped(styles.body)}>
          <StackedItems>
            {Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
              <StackedItem key={index} id={String(index)} cssOverride={styles.item}>
                <div css={scoped(styles.row)}>
                  <Flex direction="column" gap={1} cssOverride={styles.details}>
                    <SkeletonLine width="60%" lineHeight={LINE_HEIGHT} />
                    <SkeletonLine width="80%" lineHeight={LINE_HEIGHT} />
                  </Flex>
                  <Flex direction="column" gap={1} align="end" cssOverride={styles.summary}>
                    <SkeletonLine width="70px" lineHeight={LINE_HEIGHT} />
                    <SkeletonLine width="50px" lineHeight={LINE_HEIGHT} />
                  </Flex>
                </div>
              </StackedItem>
            ))}
          </StackedItems>
        </div>
      ) : orders.length === 0 ? (
        <NoOrderState />
      ) : (
        <div css={scoped(styles.body)}>
          <StackedItems>
            {orders.map((order) => {
              const fulfillment = getFulfillmentBadgeInfo(order.fulfillment_status);

              return (
                <StackedItem key={order.id} id={String(order.id)} cssOverride={styles.item}>
                  <Link
                    to={RouteConfig.Orders.get('OrderDetail').buildLink({ id: order.id })}
                    css={scoped(styles.row)}
                  >
                    <Flex direction="column" gap={1} cssOverride={styles.details}>
                      <Flex align="center" gap={1}>
                        <Text variant="small" color="primary">
                          {order.order_number}
                        </Text>
                        <Text
                          variant="small"
                          color={FULFILLMENT_TEXT_COLORS[order.fulfillment_status]}
                          truncate
                        >
                          {fulfillment.text}
                        </Text>
                      </Flex>
                      <Flex align="center" gap={2} cssOverride={styles.meta}>
                        {order.customer_name && (
                          <>
                            <Text variant="small" color="subdued" truncate>
                              {order.customer_name}
                            </Text>
                            <span css={scoped(styles.dot)} aria-hidden="true" />
                          </>
                        )}
                        <Text variant="small" color="secondary" cssOverride={styles.nowrap}>
                          {sprintf(
                            /* translators: %d: number of products in the order */
                            _n('%d Product', '%d Products', order.quantity, 'kirki-ecommerce'),
                            order.quantity,
                          )}
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex direction="column" gap={1} align="end" cssOverride={styles.summary}>
                      <Text variant="small" weight="semibold">
                        {order.invoiced_total_money_object.display}
                      </Text>
                      <Text variant="small" color="subdued">
                        {formatTimeAgo(order.created_at)}
                      </Text>
                    </Flex>
                  </Link>
                </StackedItem>
              );
            })}
          </StackedItems>
        </div>
      )}
    </OverviewCard>
  );
};

RecentOrdersCard.displayName = 'RecentOrdersCard';

export default RecentOrdersCard;

const styles = defineStyles({
  body: {
    padding: `0 ${theme.spacing[3]} ${theme.spacing[6]} ${theme.spacing[3]}`,
  },
  item: {
    height: 'auto',
    flexWrap: 'nowrap',
    padding: 0,
  },
  row: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing[3],
    minWidth: 0,
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    color: 'inherit',
    textDecoration: 'none',
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: '-2px',
    },
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    minWidth: 0,
  },
  dot: {
    width: '4px',
    height: '4px',
    flexShrink: 0,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.text.disabled,
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
  summary: {
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
    textAlign: 'center',
  },
});
