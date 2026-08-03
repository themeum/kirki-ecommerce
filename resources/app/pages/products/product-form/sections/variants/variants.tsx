import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import AttributeList from '@/pages/products/product-form/sections/variants/attribute-list/attribute-list';
import VariationTable from '@/pages/products/product-form/sections/variants/variation-table/variation-table';

const Variants = () => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Product Variations', 'kirki-ecommerce')}</CardTitle>
        <CardDescription>
          {__('Manage the options this product comes in.', 'kirki-ecommerce')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <AttributeList />
          <VariationTable />
        </Flex>
      </CardContent>
    </Card>
  );
};

Variants.displayName = 'Variants';

export default Variants;

