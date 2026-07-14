import type { Dispatch, SetStateAction } from 'react';

import { WandIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import Label from '@/molecules/label';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import { useProductForm } from '@/contexts/product-form-context';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

type InventoryProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

const Inventory = ({ errors, setErrors }: InventoryProps) => {
  const { product: productData, updateProduct } = useProductForm();

  const handleOnVariantInfoChange = (value: unknown, fieldName: string) => {
    updateProduct({ key: fieldName, value: value, variants: true });
    setErrors((prev) => ({
      ...prev,
      [`variants.0.${fieldName}`]: null,
    }));
    if (fieldName === 'track_inventory') {
      updateProduct({
        key: 'available_quantity',
        value: 0,
        variants: true,
      });
    }
  };

  const handleOnChange = (value: unknown, fieldName: string) => {
    updateProduct({ key: fieldName, value: value });
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  return (
    <Card type="form">
      <Text
        header={__('Inventory', 'kirki-ecommerce')}
        type="primary"
        padding="large"
      />
      <Checkbox
        label={__('Track quantity', 'kirki-ecommerce')}
        value={productData?.variants[0].track_inventory || false}
        onChange={(value) =>
          handleOnVariantInfoChange(value, 'track_inventory')
        }
      />

      {productData?.variants[0]?.track_inventory ? (
        <Card type="inner">
          <Grid columns={3}>
            <Input
              value={productData?.variants[0]?.available_quantity}
              label={__('Available', 'kirki-ecommerce')}
              placeholder={__('600', 'kirki-ecommerce')}
              type="number"
              onChange={(value) =>
                handleOnVariantInfoChange(value, 'available_quantity')
              }
              error={
                errors['variants.0.available_quantity'] as
                  | string
                  | boolean
                  | undefined
              }
            />

            <Input
              value={productData?.variants[0]?.committed_quantity}
              label={__('Committed', 'kirki-ecommerce')}
              placeholder={__('600', 'kirki-ecommerce')}
              type="number"
              state="disabled"
              onChange={(value) =>
                handleOnVariantInfoChange(value, 'committed_quantity')
              }
              error={
                errors['variants.0.committed_quantity'] as
                  | string
                  | boolean
                  | undefined
              }
            />

            <Input
              label={__('Minimum stock threshold', 'kirki-ecommerce')}
              helpText={__('Minimum stock threshold', 'kirki-ecommerce')}
              placeholder={__('600', 'kirki-ecommerce')}
              type="number"
            />
          </Grid>
        </Card>
      ) : (
        <Select
          optionsArray={[
            { title: __('In Stock', 'kirki-ecommerce'), value: 'true' },
            {
              title: __('Out of Stock', 'kirki-ecommerce'),
              value: 'false',
            },
          ]}
          value={productData?.variants[0]?.in_stock.toString()}
          defaultValue="true"
          label={__('Status', 'kirki-ecommerce')}
          onChange={(value) => handleOnVariantInfoChange(value, 'in_stock')}
          error={errors['variants.0.in_stock'] as string | boolean | undefined}
        />
      )}

      <Flex gap={8} direction="column">
        <Flex style={{ justifyContent: 'space-between' }}>
          <Label
            text={__('SKU', 'kirki-ecommerce')}
            helpText={
              (errors['variants.0.sku'] as string | undefined) ||
              __('SKU (Stock Keeping Unit)', 'kirki-ecommerce')
            }
          />
          <Button type="blank" icon={<WandIcon />} />
        </Flex>
        <Input
          value={productData?.variants[0]?.sku || ''}
          placeholder={__('SKU-XYZ-1234', 'kirki-ecommerce')}
          helpText={__('SKU (Stock Keeping Unit)', 'kirki-ecommerce')}
          onChange={(value) => handleOnVariantInfoChange(value, 'sku')}
          error={errors['variants.0.sku'] as string | boolean | undefined}
        />
      </Flex>
      <Flex gap={8}>
        {productData?.variants[0]?.track_inventory && (
          <Card type="innerDark" style={{ width: '30%' }}>
            <Checkbox
              label={__('Sell when out of stock', 'kirki-ecommerce')}
              value={true}
            />
          </Card>
        )}

        <Card type="innerDark" style={{ padding: '4px 8px 4px 12px' }}>
          <Flex gap={30} style={{ justifyContent: 'space-between' }}>
            <Checkbox
              value={productData?.has_limit_per_order || false}
              label={__('Limit orders to number of item', 'kirki-ecommerce')}
              helpText={__('Limit orders to number of item', 'kirki-ecommerce')}
              onChange={(value) => handleOnChange(value, 'has_limit_per_order')}
            />
            <span style={{ maxWidth: '88px' }}>
              <Input
                style={{
                  visibility: productData?.has_limit_per_order
                    ? 'visible'
                    : 'hidden',
                }}
                value={productData?.max_per_order || 1}
                onChange={(value) => handleOnChange(value, 'max_per_order')}
                error={errors?.max_per_order as string | boolean | undefined}
              />
            </span>
          </Flex>
        </Card>
      </Flex>
    </Card>
  );
};

Inventory.displayName = 'Inventory';

export default Inventory;
