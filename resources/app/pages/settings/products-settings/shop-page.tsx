import SelectField from '@/components/form/select-field';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import Text from '@/components/ui/text';
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
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
        <Text
          header={__('Shop page', 'kirki-ecommerce')}
          subHeader={__(
            'Choose the page that customers will be directed to when they click Continue Shopping.',
            'kirki-ecommerce',
          )}
          type="primary"
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />

        <Card
          className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}
          style={{ padding: 'var(--decom-spacing-4)' }}
        >
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
