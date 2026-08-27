import SelectField from '@/components/form/select-field';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Brand from '@/features/products/components/product-form/sections/right-panel/brand';
import Categories from '@/features/products/components/product-form/sections/right-panel/categories/categories';
import Collections from '@/features/products/components/product-form/sections/right-panel/collections';
import Tags from '@/features/products/components/product-form/sections/right-panel/tags';
import type { ProductStatus } from '@/features/products/schemas/catalog/product';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const RightPanel = () => {
  const statusOptions: { value: ProductStatus; label: string }[] = [
    { value: 'draft', label: __('Draft', 'kirki-ecommerce') },
    { value: 'published', label: __('Publish', 'kirki-ecommerce') },
  ];

  return (
    <div style={{ width: '30%' }}>
      <Flex direction="column" gap={4}>
        <Card cssOverride={cardStyles.formCard}>
          <CardContent>
            <SelectField
              name="status"
              label={__('Status', 'kirki-ecommerce')}
              options={statusOptions}
            />
          </CardContent>
        </Card>
        <Categories />
        <Card cssOverride={cardStyles.formCard}>
          <CardContent cssOverride={styles.fields}>
            <Tags />
            <Collections />
            <Brand />
          </CardContent>
        </Card>
      </Flex>
    </div>
  );
};

RightPanel.displayName = 'RightPanel';

export default RightPanel;

const styles = defineStyles({
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
});
