import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import AttributeList from '@/features/products/components/product-form/sections/variants/attribute-list/attribute-list';
import VariantsTable from '@/features/products/components/product-form/sections/variants/variants-table/variants-table';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const Variants = () => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Variations', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <AttributeList />
          <VariantsTable />
        </Flex>
      </CardContent>
    </Card>
  );
};

Variants.displayName = 'Variants';

export default Variants;
