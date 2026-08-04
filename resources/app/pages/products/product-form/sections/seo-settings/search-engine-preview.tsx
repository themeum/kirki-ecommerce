import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import useSeoPreviewData from '@/pages/products/product-form/sections/seo-settings/use-seo-preview-data';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';

const SearchEnginePreview = () => {
  const {
    storeName,
    storeLogoUrl,
    breadcrumbUrl,
    previewTitle,
    previewDescription,
    previewImageUrl,
    displayPrice,
  } = useSeoPreviewData('search');

  return (
    <Card cssOverride={cardStyles.innerCard}>
      <CardContent cssOverride={cardStyles.innerContent}>
        <Flex gap={4} justify="space-between" align="flex-start">
          <Flex direction="column" gap={2} cssOverride={styles.contentColumn}>
            <Flex gap={2} align="center" cssOverride={styles.storeRow}>
              <Thumbnail
                src={storeLogoUrl ?? undefined}
                size="small"
                type="circle"
                alt={storeName}
              />
              {storeName ? (
                <Text variant="small" weight="medium" cssOverride={styles.storeName}>
                  {storeName}
                </Text>
              ) : null}
              <Text variant="small" cssOverride={styles.breadcrumb}>
                {breadcrumbUrl}
              </Text>
            </Flex>
            {previewTitle ? (
              <Text weight="semibold" cssOverride={styles.title}>
                {previewTitle}
              </Text>
            ) : null}
            {previewDescription ? (
              <Text variant="small" cssOverride={styles.description}>
                {previewDescription}
              </Text>
            ) : null}
            {displayPrice ? (
              <Text variant="small" cssOverride={styles.price}>
                {displayPrice}
              </Text>
            ) : null}
          </Flex>
          <Thumbnail
            src={previewImageUrl ?? undefined}
            style={{
              height: '92px',
              width: '92px',
              flexShrink: 0,
            }}
          />
        </Flex>
      </CardContent>
    </Card>
  );
};

SearchEnginePreview.displayName = 'SearchEnginePreview';

export default SearchEnginePreview;

const styles = defineStyles({
  storeRow: {
    minWidth: 0,
  },
  storeName: {
    flexShrink: 0,
    color: theme.colors.text.primary,
  },
  breadcrumb: {
    color: theme.colors.icon.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  contentColumn: {
    minWidth: 0,
    flex: 1,
  },
  title: {
    color: theme.colors.text.emphasis,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  description: {
    color: theme.colors.text.secondary,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  price: {
    color: theme.colors.text.secondary,
  },
});
