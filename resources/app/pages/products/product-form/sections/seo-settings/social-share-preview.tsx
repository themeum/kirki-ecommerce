import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { ThumbnailPlaceholder } from '@/icons';
import useSeoPreviewData from '@/pages/products/product-form/sections/seo-settings/use-seo-preview-data';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, flexCenter, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const SocialSharePreview = () => {
  const {
    breadcrumbUrl,
    previewTitle,
    previewDescription,
    previewImageUrl,
  } = useSeoPreviewData('social');

  return (
    <Card cssOverride={mergeCss(cardStyles.innerCard, styles.card)}>
      <CardContent cssOverride={styles.cardContent}>
        {previewImageUrl ? (
          <div css={styles.imageArea}>
            <img src={previewImageUrl} alt={previewTitle || ''} />
          </div>
        ) : (
          <div css={styles.placeholder}>
            <ThumbnailPlaceholder />
            <Text color="secondary">{__('Add Image', 'kirki-ecommerce')}</Text>
          </div>
        )}
        <Flex direction="column" gap={2} cssOverride={styles.meta}>
          <Text variant="small" cssOverride={styles.breadcrumb}>
            {breadcrumbUrl}
          </Text>
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
        </Flex>
      </CardContent>
    </Card>
  );
};

SocialSharePreview.displayName = 'SocialSharePreview';

export default SocialSharePreview;

const styles = defineStyles({
  card: {
    overflow: 'hidden',
    gap: theme.spacing[0],
    padding: theme.spacing[0],
    paddingBlock: theme.spacing[0],
    paddingInline: theme.spacing[0],
  },
  cardContent: {
    padding: theme.spacing[0],
    paddingInline: theme.spacing[0],
  },
  imageArea: {
    width: '100%',
    height: '202px',
    overflow: 'hidden',
    borderBottom: `1px solid ${theme.colors.border.alt}`,
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
  },
  placeholder: {
    height: '202px',
    width: '100%',
    backgroundColor: theme.colors.background.fillSpecial2Secondary,
    ...flexCenter(),
    flexDirection: 'column',
    gap: theme.spacing[3],
    borderBottom: `1px solid ${theme.colors.border.alt}`,
  },
  meta: {
    padding: theme.spacing[3],
  },
  breadcrumb: {
    color: theme.colors.icon.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  title: {
    color: theme.colors.text.primary,
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
});
