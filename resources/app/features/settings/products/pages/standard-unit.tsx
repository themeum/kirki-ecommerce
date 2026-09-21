import NumberField from '@/components/form/number-field';
import SelectField from '@/components/form/select-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import { dimensionUnitList, weightUnitList } from '@/features/settings/lib/utils';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

export const StandardUnit = () => {
  const weightOptions = weightUnitList.map((option) => ({
    label: option.title,
    value: String(option.value),
  }));

  const dimensionOptions = dimensionUnitList.map((option) => ({
    label: option.title,
    value: String(option.value),
  }));

  return (
    <div>
      <Card
        data-search-id="products.standards"
        data-search-keywords="kg, lb, cm, inch, measurement, unit of measure"
        cssOverride={cardStyles.formCard}
      >
        <CardHeader>
          <CardTitle>{__('Units and Stock Defaults', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Default weight and dimension units, and the low stock threshold.',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Flex direction="column" gap={4}>
            <SelectField
              name="weight_unit"
              label={__('Weight unit', 'kirki-ecommerce')}
              options={weightOptions}
            />
            <SelectField
              name="dimension_unit"
              label={__('Dimension unit', 'kirki-ecommerce')}
              options={dimensionOptions}
            />

            <Separator />

            <NumberField
              name="low_stock_threshold"
              label={__('Low stock threshold', 'kirki-ecommerce')}
              placeholder={__('Enter threshold', 'kirki-ecommerce')}
              infoText={__(
                'Default quantity at or below which a variant reports as low stock, unless it has its own threshold.',
                'kirki-ecommerce',
              )}
              min={0}
            />
          </Flex>
        </CardContent>
      </Card>
    </div>
  );
};

StandardUnit.displayName = 'StandardUnit';
