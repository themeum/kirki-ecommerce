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
import { cardStyles } from '@/theme/card-styles';
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
      <Card css={cardStyles.largeCard}>
        <CardHeader css={cardStyles.sectionHeader}>
          <CardTitle>{__('Shop page', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Choose the page that customers will be directed to when they click Continue Shopping.',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={cardStyles.largeContent}>
          <Card css={cardStyles.innerCard}>
            <CardContent css={cardStyles.innerCardContent}>
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

