import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Skeleton from '@/components/ui/skeleton';
import {
  StackedItem,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { type AnalyticsMetric, useMoney } from '@/features/analytics';
import OverviewCard from '@/features/home/components/overview-card';
import SkeletonLine from '@/features/home/components/skeleton-line';
import { getStockText } from '@/features/home/lib/stock';
import { ProductEmptyStateIcon } from '@/icons/empty-state';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

const LOADING_ROW_COUNT = 5;
const LINE_HEIGHT = '22px';

type TopProduct = AnalyticsMetric<'sales_by_product'>['data']['items'][number];

type TopProductsCardProps = {
  products?: TopProduct[];
  onHide?: () => void;
};

const NoProductState = () => {
  return (
    <Flex direction="column" align="center">
      <ProductEmptyStateIcon />
      <Text color="subdued" cssOverride={styles.empty}>
        {__('No sales yet', 'kirki-ecommerce')}
      </Text>
    </Flex>
  );
};

const TopProductsCard = ({ products, onHide }: TopProductsCardProps) => {
  const { money } = useMoney();

  return (
    <OverviewCard
      title={__('Top selling products', 'kirki-ecommerce')}
      info={__(
        'The five products with the most net sales in the period: item totals after discounts, without tax, for paid orders. All variants of a product are counted together. Stock is live.',
        'kirki-ecommerce',
      )}
      actionLabel={__('View all products', 'kirki-ecommerce')}
      actionTo={RouteConfig.Products.buildLink()}
      onHide={onHide}
    >
      {products === undefined ? (
        <div css={scoped(styles.body)}>
          <StackedItems>
            {Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
              <StackedItem key={index} id={String(index)} cssOverride={styles.item}>
                <StackedItemMedia>
                  <Skeleton width={PRODUCT_IMAGE_SIZE} height={PRODUCT_IMAGE_SIZE} />
                </StackedItemMedia>
                <StackedItemContent cssOverride={styles.details}>
                  <SkeletonLine width="60%" lineHeight={LINE_HEIGHT} />
                  <SkeletonLine width="40%" lineHeight={LINE_HEIGHT} />
                </StackedItemContent>
                <Flex direction="column" gap={1} align="end" cssOverride={styles.summary}>
                  <SkeletonLine width="70px" lineHeight={LINE_HEIGHT} />
                  <SkeletonLine width="60px" lineHeight={LINE_HEIGHT} />
                </Flex>
              </StackedItem>
            ))}
          </StackedItems>
        </div>
      ) : products.length === 0 ? (
        <NoProductState />
      ) : (
        <div css={scoped(styles.body)}>
          <StackedItems>
            {products.map((product) => {
              const key = String(product.product_id ?? product.name);
              const stock = getStockText(product);
              const netSales = money(product.net_sales_money_object);

              return (
                <StackedItem key={key} id={key} cssOverride={styles.item}>
                  <StackedItemMedia>
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={PRODUCT_IMAGE_SIZE}
                      height={PRODUCT_IMAGE_SIZE}
                      fit="cover"
                    />
                  </StackedItemMedia>
                  <StackedItemContent cssOverride={styles.details}>
                    <Text variant="small" weight="medium" color="primary" truncate>
                      {product.name}
                    </Text>
                    {stock && (
                      <Text variant="tiny" color={stock.color} truncate>
                        {stock.text}
                      </Text>
                    )}
                  </StackedItemContent>
                  <Flex direction="column" gap={1} align="end" cssOverride={styles.summary}>
                    <Text variant="small" weight="medium" title={netSales.title}>
                      {netSales.text}
                    </Text>
                    <Text variant="tiny" color="secondary">
                      {sprintf(
                        /* translators: %d: number of units sold */
                        _n('%d unit sold', '%d units sold', product.units_sold, 'kirki-ecommerce'),
                        product.units_sold,
                      )}
                    </Text>
                  </Flex>
                </StackedItem>
              );
            })}
          </StackedItems>
        </div>
      )}
    </OverviewCard>
  );
};

TopProductsCard.displayName = 'TopProductsCard';

export default TopProductsCard;

const PRODUCT_IMAGE_SIZE = '42px';

const styles = defineStyles({
  body: {
    padding: `0 ${theme.spacing[3]} ${theme.spacing[6]} ${theme.spacing[3]}`,
  },
  item: {
    height: 'auto',
    flexWrap: 'nowrap',
    gap: theme.spacing[3],
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing[1],
  },
  summary: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
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
