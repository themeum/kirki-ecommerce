import SelectField from '@/components/form/select-field';
import Card from '@/molecules/card';
import Text from '@/molecules/text';
import { usePagesQuery } from '@/services/page';
import type { PageItem } from '@/types';
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
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />

        <Card type="inner" style={{ padding: 'var(--decom-spacing-4)' }}>
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
