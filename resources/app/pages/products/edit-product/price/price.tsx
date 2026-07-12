import {
  useEffect,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react';

import { useGetListAPI } from '@/hooks';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import { Select } from '@/molecules/select';
import Separator from '@/molecules/separator';
import Text from '@/molecules/text';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProduct } from '@/store/productSlice';
import { getTaxProfileListAPI } from '@/store/settingsSlice';
import type { FormErrors, SelectOption, UnitPriceValue } from '@/types';
import { __ } from '@/wpi18n';

import { TaxProfilePopup } from '@/pages/settings/tax-settings/tax-profile/tax-profile-popup';
import { calculateProfit } from '@/pages/utils';
import BaseUnitPopup from '@/pages/products/edit-product/price/base-unit-popup';

type PriceProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

type CurrencyRef = {
  symbol?: string;
  [key: string]: unknown;
};

const Price = ({ errors, setErrors }: PriceProps) => {
  const dispatch = useAppDispatch();
  const [taxProfileList, setTaxProfileList] = useState<SelectOption[]>([]);
  const [openTaxProfilePopup, setOpenTaxProfilePopup] = useState(false);
  const { data: productData } = useAppSelector((state) => state?.product);
  useGetListAPI({
    reducerName: 'settings',
    apiCallBack: getTaxProfileListAPI,
    nestedToggler: ['tax', 'taxProfile'],
    limit: -1,
  });
  const { loaded: taxLoaded, data: taxProfile } = useAppSelector(
    (state) => state?.settings?.tax?.taxProfile,
  );

  useEffect(() => {
    if (taxLoaded) {
      formatTaxProfileList();
    }
  }, [taxProfile]);

  const handleOnVariantInfoChange = (value: unknown, fieldName: string) => {
    dispatch(
      updateProduct({
        key: fieldName,
        value: value,
        variants: true,
      }),
    );
    setErrors((prev) => ({
      ...prev,
      [`variants.0.${fieldName}`]: null,
    }));
  };

  const formatTaxProfileList = () => {
    const updatedData = (taxProfile ?? []).map((item) => ({
      value: item?.id,
      title: item?.name,
    }));

    setTaxProfileList(updatedData);
  };

  const currency = productData?.currency as CurrencyRef;
  const TaxProfilePopupView = TaxProfilePopup as (props: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: unknown) => void;
  }) => ReactElement;

  return (
    <Card type="form">
      <Text
        header={__('Price', 'kirki-ecommerce')}
        type="primary"
        padding="large"
      />
      <Grid columns={2}>
        <Input
          leftSymbol={(currency?.symbol as string) || '$'}
          style={{ textIndent: '12px' }}
          value={productData?.variants[0]?.price as string | number | undefined}
          label={__('Regular price', 'kirki-ecommerce')}
          placeholder={__('29.00', 'kirki-ecommerce')}
          type="number"
          onChange={(value) => handleOnVariantInfoChange(value, 'price')}
          error={errors['variants.0.price'] as string | boolean | undefined}
        />
        <Input
          value={
            productData?.variants[0]?.sale_price as string | number | undefined
          }
          leftSymbol={(currency?.symbol as string) || '$'}
          style={{ textIndent: '12px' }}
          label={__('Sale price', 'kirki-ecommerce')}
          placeholder={__('19.99', 'kirki-ecommerce')}
          type="number"
          onChange={(value) => handleOnVariantInfoChange(value, 'sale_price')}
          error={errors['variants.0.sale_price'] as string | boolean | undefined}
        />
      </Grid>

      <Flex direction="column" gap={8}>
        <Card
          type="innerDark"
          style={{
            padding: '4px 8px 4px 12px',
            height: '44px',
          }}
        >
          <Flex
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Checkbox
              style={{ flex: '1' }}
              value={productData?.variants[0]?.show_unit_price || false}
              label={__('Show unit price', 'kirki-ecommerce')}
              helpText={__('Show unit price', 'kirki-ecommerce')}
              onChange={(value) =>
                handleOnVariantInfoChange(value, 'show_unit_price')
              }
            />
            <div>
              <Flex
                gap={8}
                style={{
                  flex: '2',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  visibility: productData?.variants[0]?.show_unit_price
                    ? 'visible'
                    : 'hidden',
                }}
              >
                <Text
                  subHeader={__('Base price per unit', 'kirki-ecommerce')}
                />
                <BaseUnitPopup
                  errors={errors}
                  setErrors={setErrors}
                  data={productData?.variants[0]}
                  onChange={(value: UnitPriceValue) =>
                    handleOnVariantInfoChange(value, 'base_price_per_unit')
                  }
                />
              </Flex>
            </div>
          </Flex>
        </Card>

        <Card
          type="innerDark"
          style={{
            padding: '4px 8px 4px 12px',
            height: '44px',
          }}
        >
          <Grid style={{ alignItems: 'center' }}>
            <Checkbox
              value={productData?.variants[0]?.charge_taxes || false}
              label={__('Charge tax on this product', 'kirki-ecommerce')}
              helpText={__('Charge tax on this product', 'kirki-ecommerce')}
              onChange={(value) =>
                handleOnVariantInfoChange(value, 'charge_taxes')
              }
            />

            <Select
              value={
                productData?.variants[0]?.tax_profile_id as
                  | string
                  | number
                  | undefined
              }
              style={{
                visibility: productData?.variants[0]?.charge_taxes
                  ? 'visible'
                  : 'hidden',
              }}
              btnText="Add Tax Profile"
              onNewItemAdd={() => setOpenTaxProfilePopup(true)}
              optionsArray={taxProfileList}
              onChange={(value) =>
                handleOnVariantInfoChange(value, 'tax_profile_id')
              }
            />
          </Grid>
        </Card>
      </Flex>

      <Separator />

      <Grid columns={3}>
        <Input
          value={productData?.variants[0].cost_of_goods || ''}
          leftSymbol={
            productData?.variants[0].cost_of_goods
              ? (currency?.symbol as string) || '$'
              : null
          }
          label={__('Cost of goods', 'kirki-ecommerce')}
          placeholder={__('--', 'kirki-ecommerce')}
          type="number"
          onChange={(value) =>
            handleOnVariantInfoChange(value, 'cost_of_goods')
          }
          error={
            errors['variants.0.cost_of_goods'] as string | boolean | undefined
          }
        />
        <Input
          value={calculateProfit('profit', productData?.variants[0])}
          label={__('Profit', 'kirki-ecommerce')}
          type="number"
          leftSymbol={(currency?.symbol as string) || '$'}
          state="disabled"
        />
        <Input
          value={calculateProfit('margin', productData?.variants[0])}
          label={__('Margin(%)', 'kirki-ecommerce')}
          type="number"
          state="disabled"
        />
      </Grid>
      <TaxProfilePopupView
        isOpen={openTaxProfilePopup}
        onClose={() => setOpenTaxProfilePopup(false)}
        onSave={(value) => handleOnVariantInfoChange(value, 'tax_profile_id')}
      />
    </Card>
  );
};

Price.displayName = 'Price';

export default Price;
