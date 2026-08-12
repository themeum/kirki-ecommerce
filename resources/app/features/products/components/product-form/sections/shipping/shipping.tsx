import ShippingBoxField from '@/components/form/shipping-box-field';
import WeightField from '@/components/form/weight-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import ShippingProfile from '@/features/products/components/product-form/sections/shipping/shipping-profile';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const Shipping = () => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Shipping', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={2}>
          <WeightField
            name="variants.0.weight"
            unitName="variants.0.weight_unit"
            label={__('Weight', 'kirki-ecommerce')}
          />
          <ShippingBoxField name="variants.0.shipping_box_id" />
          <ShippingProfile />
        </Flex>
      </CardContent>
    </Card>
  );
};

Shipping.displayName = 'Shipping';

export default Shipping;
