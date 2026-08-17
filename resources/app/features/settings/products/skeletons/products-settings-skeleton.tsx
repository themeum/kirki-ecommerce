import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { ProductSettingsIcon } from '@/icons';
import { __ } from '@/wpi18n';

const ProductsSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[3, 2]}
    header={
      <SettingsPageHeader
        icon={<ProductSettingsIcon />}
        title={__('Products', 'kirki-ecommerce')}
      />
    }
  />
);

ProductsSettingsSkeleton.displayName = 'ProductsSettingsSkeleton';

export default ProductsSettingsSkeleton;
