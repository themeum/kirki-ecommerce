import WeightField from '@/components/form/weight-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { useVariantField } from '@/features/products/components/variant-sections/use-variant-field';
import { ShippingBoxField, ShippingProfileField } from '@/features/settings';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const Shipping = () => {
  const field = useVariantField();

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Shipping', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={2}>
          <WeightField
            name={field('weight')}
            unitName={field('weight_unit')}
            label={__('Weight', 'kirki-ecommerce')}
          />
          <ShippingBoxField name={field('shipping_box_id')} />
          <ShippingProfileField name={field('shipping_profile_id')} />
        </Flex>
      </CardContent>
    </Card>
  );
};

Shipping.displayName = 'Shipping';

export default Shipping;
