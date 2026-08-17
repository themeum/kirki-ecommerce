import { type ReactElement, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import CreatableSelectField from '@/components/form/creatable-select-field';
import MoneyField from '@/components/form/money-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import type { UnitPriceValue } from '@/features/products';
import BaseUnitPopup from '@/features/products/components/product-form/sections/price/base-unit-dialog';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { TaxProfilePopup, useTaxProfilesQuery } from '@/features/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { calculateProfit } from '@/utils/common';
import { __ } from '@/wpi18n';

const Price = () => {
  const { control, setValue } = useFormContext<ProductFormInput>();
  const [openTaxProfilePopup, setOpenTaxProfilePopup] = useState(false);
  const { data: taxProfiles } = useTaxProfilesQuery({ limit: -1 });

  const showUnitPrice = Boolean(
    useWatch({ control, name: 'variants.0.show_unit_price' }),
  );
  const chargeTaxes = Boolean(
    useWatch({ control, name: 'variants.0.charge_taxes' }),
  );
  const currency = useWatch({ control, name: 'currency' });
  const variant = useWatch({ control, name: 'variants.0' });
  const currencySymbol = currency?.symbol || '$';

  const taxProfileList = (taxProfiles ?? []).map((item) => ({
    value: item?.id,
    label: item?.name,
  }));

  const handleUnitPriceChange = (value: UnitPriceValue) => {
    setValue('variants.0.total_unit_amount', value?.total_unit_amount ?? null, {
      shouldDirty: true,
    });
    setValue('variants.0.total_unit', value?.total_unit ?? null, {
      shouldDirty: true,
    });
    setValue('variants.0.base_unit_amount', value?.base_unit_amount ?? null, {
      shouldDirty: true,
    });
    setValue('variants.0.base_unit', value?.base_unit ?? null, {
      shouldDirty: true,
    });
  };

  const TaxProfilePopupView = TaxProfilePopup as (props: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: unknown) => void;
  }) => ReactElement;

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Price', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent cssOverride={styles.cardContent}>
        <Grid columns={2}>
          <MoneyField
            name="variants.0.base_price"
            label={__('Regular price', 'kirki-ecommerce')}
            placeholder={__('29.00', 'kirki-ecommerce')}
            currencySymbol={currencySymbol}
          />
          <MoneyField
            name="variants.0.base_sale_price"
            label={__('Sale price', 'kirki-ecommerce')}
            placeholder={__('19.99', 'kirki-ecommerce')}
            currencySymbol={currencySymbol}
          />
        </Grid>

        <Flex direction="column" gap={2}>
          <Card cssOverride={cardStyles.innerDarkCard}>
            <CardContent cssOverride={styles.innerDarkRowContent}>
              <Flex align="center" justify="space-between" gap={2}>
                <CheckboxField
                  name="variants.0.show_unit_price"
                  label={__('Show unit price', 'kirki-ecommerce')}
                  infoText={__(
                    'Display the price per unit on the product page.',
                    'kirki-ecommerce',
                  )}
                />
                {showUnitPrice && (
                  <Flex gap={2} align="center" justify="flex-end" shrink={0}>
                    <Text color="secondary" variant="small">
                      {__('Base price per unit', 'kirki-ecommerce')}
                    </Text>
                    <BaseUnitPopup
                      data={variant as never}
                      currencySymbol={currencySymbol}
                      onChange={handleUnitPriceChange}
                    />
                  </Flex>
                )}
              </Flex>
            </CardContent>
          </Card>

          <Card cssOverride={cardStyles.innerDarkCard}>
            <CardContent cssOverride={styles.innerDarkRowContent}>
              <Flex align="center" justify="space-between" gap={2}>
                <CheckboxField
                  name="variants.0.charge_taxes"
                  label={__('Charge tax on this product', 'kirki-ecommerce')}
                  infoText={__(
                    'Apply tax to this product using a tax profile.',
                    'kirki-ecommerce',
                  )}
                />
                {chargeTaxes && (
                  <CreatableSelectField
                    name="variants.0.tax_profile_id"
                    options={taxProfileList}
                    placeholder={__('Add Tax Profile', 'kirki-ecommerce')}
                    addNewLabel={__('Add Tax Profile', 'kirki-ecommerce')}
                    onCreateNew={() => setOpenTaxProfilePopup(true)}
                    valueAsNumber
                    cssOverride={styles.taxProfileField}
                  />
                )}
              </Flex>
            </CardContent>
          </Card>
        </Flex>

        <Separator />

        <Grid columns={3}>
          <MoneyField
            name="variants.0.base_cost_of_goods"
            label={__('Cost of goods', 'kirki-ecommerce')}
            placeholder={__('0.00', 'kirki-ecommerce')}
            currencySymbol={currencySymbol}
            showSymbolWhenEmpty={false}
          />
          <Flex direction="column" gap={2}>
            <Label>{__('Profit', 'kirki-ecommerce')}</Label>
            <div style={{ position: 'relative' }}>
              <span
                css={scoped(styles.inputLeftSymbol)}
              >
                {currencySymbol}
              </span>
              <Input
                value={calculateProfit('profit', variant)}
                cssOverride={{ textIndent: '12px' }}
                type="number"
                disabled
                placeholder="0.00"
              />
            </div>
          </Flex>
          <Flex direction="column" gap={2}>
            <Label>{__('Margin(%)', 'kirki-ecommerce')}</Label>
            <Input
              value={calculateProfit('margin', variant)}
              type="number"
              disabled
              placeholder="0%"
            />
          </Flex>
        </Grid>
      </CardContent>
      <TaxProfilePopupView
        isOpen={openTaxProfilePopup}
        onClose={() => setOpenTaxProfilePopup(false)}
        onSave={(value) =>
          setValue('variants.0.tax_profile_id', value as number, {
            shouldDirty: true,
          })
        }
      />
    </Card>
  );
};

Price.displayName = 'Price';

export default Price;

const styles = defineStyles({
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
  innerDarkRowContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: `${theme.spacing[1]} ${theme.spacing[2]} ${theme.spacing[1]} ${theme.spacing[3]}`,
    height: '44px',
  },
  taxProfileField: {
    width: 'auto',
    minWidth: '160px',
  },
  inputLeftSymbol: {
    ...flexCenter(),
    color: theme.colors.text.secondary,
    position: 'absolute',
    left: theme.spacing[3],
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
});
