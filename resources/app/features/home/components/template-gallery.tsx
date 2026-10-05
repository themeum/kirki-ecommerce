import Badge from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import { getStoreTemplates } from '@/features/home/lib/templates';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const TemplateGallery = () => {
  return (
    <div css={scoped(styles.grid)}>
      {getStoreTemplates().map((template) => (
        <a
          key={template.name}
          href={template.url}
          target="_blank"
          rel="noopener noreferrer"
          css={scoped(styles.link)}
        >
          <Card cssOverride={styles.card}>
            <Badge cssOverride={styles.badge}>{__('Coming soon', 'kirki-ecommerce')}</Badge>
            <Image
              src={template.image}
              alt={template.name}
              width="100%"
              height={TEMPLATE_IMAGE_HEIGHT}
              fit="cover"
              cssOverride={styles.image}
            />
            <Flex direction="column" cssOverride={styles.meta}>
              <Text variant="small" weight="medium" truncate>
                {template.name}
              </Text>
              <Text color="subdued" truncate cssOverride={{ fontSize: '10px' }}>
                {template.author}
              </Text>
            </Flex>
          </Card>
        </a>
      ))}
    </div>
  );
};

TemplateGallery.displayName = 'TemplateGallery';

export default TemplateGallery;

const TEMPLATE_CARD_SIZE = '196px';
const TEMPLATE_IMAGE_HEIGHT = '140px';

const styles = defineStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: theme.spacing[2],
    width: '100%',
  },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    pointerEvents: 'none',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: TEMPLATE_CARD_SIZE,
    height: TEMPLATE_CARD_SIZE,
    padding: 0,
    gap: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: theme.spacing[1],
    right: theme.spacing[1],
    zIndex: 1,
    backgroundColor: '#FFD412', // @todo: will be updated later,
    color: theme.colors.text.primary,
  },
  image: {
    border: 'none',
    borderRadius: 0,
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    borderTop: `1px solid ${theme.colors.border.default}`,
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
  },
});
