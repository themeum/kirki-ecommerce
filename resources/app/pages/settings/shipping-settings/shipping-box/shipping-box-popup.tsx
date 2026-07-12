import { useEffect, useState } from 'react';

import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Text from '@/molecules/text';
import Separator from '@/molecules/separator';
import ActionGroup from '@/molecules/action-group';
import { Popover, PopoverBody, PopoverHeader } from '@/molecules/popover';
import { Select } from '@/molecules/select';
import { __, sprintf } from '@/wpi18n';

import {
  createShippingBoxAPI,
  updateShippingBoxAPI,
  setKeyValue,
} from '@/store/settingsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import { dispatchToastMessage } from '@/pages/utils';
import type { FormErrors, ShippingBox } from '@/types';
import { isApiSuccess } from '@/types';

import { BoxGenerator } from '@/pages/settings/shipping-settings/shipping-box/box-generator';

type ShippingBoxFormData = {
  length?: number | string;
  width?: number | string;
  height?: number | string;
  unit?: string;
  name?: string;
  is_default?: boolean;
};

type ShippingBoxPopupProps = {
  selectedItem?: ShippingBox | null;
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (id?: number) => void;
  fetchShippingBoxList?: () => void;
};

const ShippingBoxPopup = ({
  selectedItem = null,
  isOpen,
  onClose = () => {},
  onSave = () => {},
}: ShippingBoxPopupProps) => {
  const dispatch = useAppDispatch();
  const { data: productSettingsData } = useAppSelector(
    (state) => state.settings?.product,
  );
  const [shippingBoxData, setShippingBoxData] = useState<ShippingBoxFormData>(
    {},
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const UNIT_TO_PX: Record<string, number> = {
    cm: 10,
    in: 25.4,
  };

  useEffect(() => {
    setShippingBoxData({
      length: (selectedItem?.length as number | string) ?? 120,
      width: (selectedItem?.width as number | string) ?? 80,
      height: (selectedItem?.height as number | string) ?? 80,
      unit:
        (selectedItem?.unit as string) ??
        (productSettingsData?.dimension_unit as string) ??
        'in',
      name: selectedItem?.name ?? '',
      is_default: (selectedItem?.is_default as boolean) || false,
    });
  }, []);

  const handleOnChange = (key: string, value: unknown) => {
    setShippingBoxData((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
    setErrors((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const convertValue = (
    value: number | string | undefined,
    fromUnit: string | undefined,
    toUnit: string,
  ) => {
    if (!value || fromUnit === toUnit) {
      return value;
    }

    const valueInPx = Number(value) * UNIT_TO_PX[fromUnit ?? 'in'];
    return +(valueInPx / UNIT_TO_PX[toUnit]).toFixed(2);
  };

  const handleUnitChange = (newUnit: string) => {
    setShippingBoxData((prev) => {
      const oldUnit = prev.unit;

      return {
        ...prev,
        length: convertValue(prev.length, oldUnit, newUnit),
        width: convertValue(prev.width, oldUnit, newUnit),
        height: convertValue(prev.height, oldUnit, newUnit),
        unit: newUnit,
      };
    });
  };

  const handleCreateOrUpdateBox = async () => {
    let result;
    if (selectedItem) {
      result = await updateShippingBoxAPI(selectedItem?.id, shippingBoxData);
    } else {
      const data = {
        ...shippingBoxData,
        is_default: false,
      };
      result = await createShippingBoxAPI(data);
    }

    if (isApiSuccess(result)) {
      dispatch(
        setKeyValue({
          key: 'toggler',
          value: Date.now(),
          nestedToggler: ['shipping', 'shippingBox'],
        }),
      );
      onSave((result?.data as { id?: number })?.id);
      dispatchToastMessage('success', {
        title: selectedItem
          ? __('Shipping box updated', 'kirki-ecommerce')
          : __('Shipping box created', 'kirki-ecommerce'),
      });
      handleOnclosePopup();
    } else {
      const errorResult = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorResult.errors));
    }
  };

  const handleOnclosePopup = () => {
    setShippingBoxData({});
    setErrors({});
    onClose();
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={handleOnclosePopup}
      style={{ width: '632px', zIndex: '1000' }}
    >
      <PopoverHeader
        style={{ padding: 'var(--decom-spacing-5)' }}
        onClose={handleOnclosePopup}
      >
        {selectedItem
          ? __('Edit Shipping Box', 'kirki-ecommerce')
          : __('Create shipping box', 'kirki-ecommerce')}
      </PopoverHeader>
      <PopoverBody
        style={{
          gap: '25px',
          padding:
            'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-3) var(--decom-spacing-5)',
        }}
      >
        <Input
          label={__('Title', 'kirki-ecommerce')}
          placeholder={__('Regular box', 'kirki-ecommerce')}
          value={shippingBoxData?.name}
          onChange={(value) => handleOnChange('name', String(value))}
          error={errors['name'] as string | undefined}
        />
        <div>
          <Card
            type="inner"
            style={{
              position: 'relative',
              overflow: 'visible',
              paddingTop: 'var(--decom-spacing-5)',
            }}
          >
            <Text
              type="secondary"
              header={__('Dimensions', 'kirki-ecommerce')}
              style={{
                top: '-12px',
                left: '240px',
                position: 'absolute',
                padding: 'var(--decom-spacing-0) var(--decom-spacing-2)',
                backgroundColor: 'var(--decom-text-text-light)',
              }}
            />
            <Flex gap={16} style={{ alignItems: 'flex-end' }}>
              <Input
                placeholder={__('12', 'kirki-ecommerce')}
                label={__('Length', 'kirki-ecommerce')}
                type="number"
                value={shippingBoxData?.length}
                onChange={(value: unknown) => handleOnChange('length', value)}
                onBlur={(value: unknown) => handleOnChange('length', value)}
                error={errors?.length as string | undefined}
                min={0}
                max={1000}
              />
              <Input
                label={__('Width', 'kirki-ecommerce')}
                placeholder={__('12', 'kirki-ecommerce')}
                type="number"
                value={sprintf(
                  __('%d', 'kirki-ecommerce'),
                  shippingBoxData?.width ?? 0,
                )}
                onChange={(value: unknown) => handleOnChange('width', value)}
                onBlur={(value: unknown) => handleOnChange('width', value)}
                error={errors?.width as string | undefined}
                min={0}
                max={1000}
              />
              <Input
                label={__('Height', 'kirki-ecommerce')}
                placeholder={__('12', 'kirki-ecommerce')}
                type="number"
                value={shippingBoxData?.height}
                onChange={(value: unknown) => handleOnChange('height', value)}
                onBlur={(value: unknown) => handleOnChange('height', value)}
                error={errors?.height as string | undefined}
                min={0}
                max={1000}
              />
              <Select
                value={shippingBoxData?.unit}
                onChange={(value) => handleUnitChange(String(value))}
                style={{ width: '70px', gap: '0' }}
                optionsArray={[
                  { title: __('cm', 'kirki-ecommerce'), value: 'cm' },
                  { title: __('in', 'kirki-ecommerce'), value: 'in' },
                ]}
                helpText={errors?.unit as string | undefined}
                error={errors?.unit as string | undefined}
              />
            </Flex>
          </Card>
          <Card
            type="dark"
            style={{
              borderRadius:
                'var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-md) var(--decom-radius-rounded-md)',
              marginTop: '-8px',
              padding: 'var(--decom-spacing-1)',
              height: '230px',
            }}
          >
            <BoxGenerator
              length={Number(shippingBoxData.length) || 0}
              width={Number(shippingBoxData.width) ?? 0}
              height={Number(shippingBoxData.height) ?? 0}
              unit={shippingBoxData?.unit ?? 'in'}
            />
          </Card>
        </div>
      </PopoverBody>
      <Flex
        direction={'column'}
        style={{ padding: 'var(--decom-spacing-0) var(--decom-spacing-5)' }}
      >
        <Separator style={{ margin: 'var(--decom-spacing-0)' }} />
        <ActionGroup
          style={{
            padding: 'var(--decom-spacing-3) var(--decom-spacing-0)',
            gap: 'var(--decom-spacing-2)',
          }}
        >
          <Button
            type="outlined"
            text={__('Cancel', 'kirki-ecommerce')}
            size="small"
            onClick={handleOnclosePopup}
          />
          <Button
            type="primary"
            text={
              selectedItem
                ? __('Update', 'kirki-ecommerce')
                : __('Add', 'kirki-ecommerce')
            }
            size="small"
            onClick={handleCreateOrUpdateBox}
          />
        </ActionGroup>
      </Flex>
    </Popover>
  );
};

ShippingBoxPopup.displayName = 'ShippingBoxPopup';

export default ShippingBoxPopup;
