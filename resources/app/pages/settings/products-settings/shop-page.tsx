import SelectField from '@/components/form/select-field';
import { Card } from '@/components/ui/card';
import Text from '@/components/ui/text';
import { usePagesQuery } from '@/services/page';
import type { PageItem } from '@/types';
import { theme } from '@/theme';
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
      <Card type="large">
        <Text
          header={__('Shop page', 'kirki-ecommerce')}
          subHeader={__(
            'Choose the page that customers will be directed to when they click Continue Shopping.',
            'kirki-ecommerce',
          )}
          type="primary"
          style={{ gap: theme.spacing.base }}
        />

        <Card type="inner" style={{ padding: theme.spacing['2xl'] }}>
          <SelectField
            name="shop_page"
            label={__('Shop page', 'kirki-ecommerce')}
            options={shopPageOptions}
            placeholder={__('Select Page', 'kirki-ecommerce')}
          />
        </Card>
      </Card>
    </div>
  );
};

ShopPage.displayName = 'ShopPage';
