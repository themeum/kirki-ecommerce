import {
  useEffect,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react';

import { EyeClosedIcon, EyeIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import SelectInput from '@/molecules/select-input';
import Text from '@/molecules/text';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProduct } from '@/store/productSlice';
import type { FormErrors, ShippingBox } from '@/types';
import { __ } from '@/wpi18n';

import { BoxGenerator } from '../../../settings/shipping-settings/shipping-box/box-generator';
import ShippingBoxSelect from './shipping-box';
import ShippingProfile from './shipping-profile';

type ShippingProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
};

type SelectInputValue = {
  value?: string | number;
  unit?: string | number;
};

type BoxGeneratorData = ShippingBox & {
  length?: number | string;
  height?: number | string;
  width?: number | string;
  unit?: string;
};

const Shipping = ({ errors, setErrors }: ShippingProps) => {
  const dispatch = useAppDispatch();
  const { data: productData } = useAppSelector((state) => state.product);
  const { loaded: boxListLoaded, data: shippingBox } = useAppSelector(
    (state) => state.settings?.shipping?.shippingBox,
  );
  const [boxGeneratorData, setBoxGeneratorData] = useState<
    Partial<BoxGeneratorData>
  >({});
  const [showShippingBox, setShowShippingBox] = useState(true);

  useEffect(() => {
    if (productData.variants[0]?.shipping_box_id && boxListLoaded) {
      const boxData = shippingBox?.find(
        (item) => item.id === productData.variants[0]?.shipping_box_id,
      );
      setBoxGeneratorData((boxData as BoxGeneratorData) || {});
    }
  }, [productData.variants[0]?.shipping_box_id, shippingBox]);

  const handleOnVariantInfoChange = (value: unknown, fieldName: string) => {
    if (fieldName === 'weight') {
      const weightValue = value as SelectInputValue;
      dispatch(
        updateProduct({
          key: 'weight',
          value: weightValue.value,
          variants: true,
        }),
      );
      dispatch(
        updateProduct({
          key: 'weight_unit',
          value: weightValue.unit,
          variants: true,
        }),
      );
      setErrors((prev) => ({
        ...prev,
        [`variants.0.weight`]: null,
        [`variants.0.weight_unit`]: null,
      }));
    } else {
      dispatch(
        updateProduct({ key: fieldName, value: value, variants: true }),
      );
      setErrors((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };

  const BoxGeneratorView = BoxGenerator as (props: {
    length?: number | string;
    height?: number | string;
    width?: number | string;
    unit?: string;
  }) => ReactElement;

  return (
    <Card type="form">
      <Text
        header={__('Shipping', 'kirki-ecommerce')}
        type="primary"
        padding="large"
      />
      <SelectInput
        label={__('Weight', 'kirki-ecommerce')}
        value={{
          value: productData?.variants[0].weight || '',
          unit: productData?.variants[0]?.weight_unit || '',
        }}
        optionsArray={[
          { value: 'kg', title: __('KG', 'kirki-ecommerce'), fallback: true },
          { value: 'g', title: __('G', 'kirki-ecommerce') },
          { value: 'lb', title: __('LB', 'kirki-ecommerce') },
          { value: 'oz', title: __('OZ', 'kirki-ecommerce') },
        ]}
        onChange={(value) => handleOnVariantInfoChange(value, 'weight')}
        error={
          (errors?.weight || errors?.weight_unit) as
            | string
            | boolean
            | undefined
        }
      />
      <div>
        <Card
          type="inner"
          style={{
            position: 'relative',
            overflow: 'visible',
            marginTop: '16px',
            paddingTop: '20px',
          }}
        >
          <Flex
            style={{
              top: '-18px',
              left: '8px',
              right: '8px',
              position: 'absolute',
            }}
          >
            <span
              style={{
                backgroundColor: '#ffffff',
                paddingLeft: '8px',
              }}
            >
              <Text
                type="secondary"
                header={__('Shipping Box', 'kirki-ecommerce')}
              />
            </span>
            <ActionGroup>
              <span
                style={{
                  backgroundColor: '#ffffff',
                  paddingRight: '8px',
                }}
              >
                <Button
                  type="secondary"
                  size="small"
                  leftIcon={showShippingBox ? <EyeIcon /> : <EyeClosedIcon />}
                  onClick={() => {
                    setShowShippingBox((prev) => !prev);
                  }}
                />
              </span>
            </ActionGroup>
          </Flex>
          <Flex gap={8} direction="column">
            <ShippingBoxSelect
              value={productData?.variants[0]?.shipping_box_id}
              onChange={(value, fieldName) =>
                handleOnVariantInfoChange(value, fieldName)
              }
            />
          </Flex>
        </Card>
        {showShippingBox && (
          <Card
            type="dark"
            style={{
              borderRadius: '0px 0px 6px 6px',
              marginTop: '-8px',
              padding: '4px',
              height: '230px',
            }}
          >
            <BoxGeneratorView
              length={boxGeneratorData?.length || 0}
              height={boxGeneratorData?.height || 0}
              width={boxGeneratorData?.width || 0}
              unit={boxGeneratorData?.unit || 'in'}
            />
          </Card>
        )}
      </div>
      <ShippingProfile
        onChange={(val, fieldName) => handleOnVariantInfoChange(val, fieldName)}
      />
    </Card>
  );
};

Shipping.displayName = 'Shipping';

export default Shipping;
