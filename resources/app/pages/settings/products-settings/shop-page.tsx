import SelectField from '@/components/form/select-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePagesQuery } from '@/services/page';
import type { PageItem } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

export const ShopPage = () => {
  const { data: pagesData } = usePagesQuery();

  const pageList = pagesData ?? [];

  const shopPageOptions = pageList.map((page: PageItem) => ({
    label: page.title,
    value: String(page.id),
  }));

  return (
    <div>
      <Card css={styles.largeCard}>
        <CardHeader css={styles.sectionHeader}>
          <CardTitle>{__('Shop page', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Choose the page that customers will be directed to when they click Continue Shopping.',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={styles.largeContent}>
          <Card css={styles.innerCard}>
            <CardContent css={styles.innerCardContent}>
              <SelectField
                name="shop_page"
                label={__('Shop page', 'kirki-ecommerce')}
                options={shopPageOptions}
                placeholder={__('Select Page', 'kirki-ecommerce')}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

ShopPage.displayName = 'ShopPage';

const styles = {
  largeCard: scoped({
    gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({
    paddingInline: theme.spacing['3xl'],
  }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerCardContent: scoped({
    padding: theme.spacing['2xl'],
  }),
};
