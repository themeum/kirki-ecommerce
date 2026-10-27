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
            <Image
              src={template.image}
              alt={template.name}
              width="100%"
              height={TEMPLATE_IMAGE_HEIGHT}
              fit="cover"
              cssOverride={styles.image}
            />
            <Flex
              align="center"
              justify="space-between"
              cssOverride={{ padding: theme.spacing[2] }}
            >
              <Flex direction="column">
                <Text
                  variant="tiny"
                  weight="medium"
                  truncate
                  cssOverride={{ fontSize: 10, lineHeight: 1 }}
                >
                  {template.name}
                </Text>
                <Text color="subdued" truncate cssOverride={{ fontSize: 10 }}>
                  {template.author}
                </Text>
              </Flex>
              <Badge cssOverride={styles.badge}>{__('Coming soon', 'kirki-ecommerce')}</Badge>
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
    height: 'auto',
    padding: 0,
    gap: 0,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: `0px -1px 1px 0.5px #0000001A inset, 0px 0.5px 1px 0px #0000001A inset`,
  },
  badge: {
    zIndex: 1,
    backgroundColor: theme.colors.background.solidSurfaceAlt,
    fontSize: 8,
    color: theme.colors.text.subdued,
  },
  image: {
    border: 'none',
    borderRadius: 0,
  },
});
