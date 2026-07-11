import Card from '@/molecules/card';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import { useAppSelector } from '@/store/hooks';
import type { FormErrors, PageItem, SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

type ShopPageProps = {
  dataObj: SettingsSectionData;
  handleOnChange: (value: unknown, key: string) => void;
  errors: FormErrors;
};

export const ShopPage = (props: ShopPageProps) => {
  const { dataObj, handleOnChange, errors } = props;
  const { data: pageList } = useAppSelector((state) => state.pages);

  const shopPageOptions = Array.isArray(pageList)
    ? pageList.map((page: PageItem) => ({
        title: page.title,
        value: page.id as number,
      }))
    : [];
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
          <Select
            label={__('Shop page', 'kirki-ecommerce')}
            value={dataObj?.['shop_page'] as string | number}
            onChange={(value) => handleOnChange(value, 'shop_page')}
            optionsArray={shopPageOptions}
            placeholder={__('Select Page', 'kirki-ecommerce')}
            error={errors['data.shop_page'] as string | boolean | undefined}
          />
        </Card>
      </Card>
    </div>
  );
};
