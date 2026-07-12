import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { ChevronDownIcon } from '@/icons';
import Button from '@/molecules/button';
import { DropdownMenuContent } from '@/molecules/dropdown';
import Flex from '@/molecules/flex';
import SelectInput from '@/molecules/select-input';
import type {
  FormErrors,
  ProductVariant,
  SelectOption,
  UnitPriceValue,
} from '@/types';
import { __ } from '@/wpi18n';

import { getSpecifiedUnitList, normalizedUnit, unitList } from '@/pages/products/edit-product/price/utils';

type SelectInputValue = {
  value?: string | number;
  unit?: string | number;
};

type BaseUnitPopupProps = {
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  data?: ProductVariant;
  onChange: (value: UnitPriceValue & { price?: number | string | null }) => void;
  buttonProps?: Record<string, unknown>;
};

type UnitDataState = UnitPriceValue & {
  price?: number | string | null;
};

const BaseUnitPopup = ({
  errors,
  onChange,
  buttonProps,
  data,
}: BaseUnitPopupProps) => {
  const totalUnitAnchorRef = useRef<HTMLDivElement>(null);
  const baseUnitAnchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLSpanElement | HTMLAnchorElement>(null);
  const [openUnitPopup, setOpenUnitPopup] = useState(false);
  const [unitData, setUnitData] = useState<UnitDataState>({
    total_unit_amount: data?.total_unit_amount,
    total_unit: data?.total_unit,
    base_unit_amount: data?.base_unit_amount,
    base_unit: data?.base_unit,
    price: data?.price,
  });

  useEffect(() => {
    setUnitData((prev) => ({
      ...prev,
      total_unit_amount: data?.total_unit_amount,
      total_unit: data?.total_unit,
      base_unit_amount: data?.base_unit_amount,
      base_unit: data?.base_unit,
      price: data?.price,
    }));
  }, [data]);

  const basePricePerBaseUnitAmount = () => {
    const {
      total_unit_amount,
      total_unit,
      base_unit_amount,
      base_unit,
      price,
    } = unitData;

    const totalAmountInGrams =
      (total_unit_amount as number) *
      normalizedUnit[total_unit as string];

    const baseAmountInGrams =
      (base_unit_amount as number) * normalizedUnit[base_unit as string];

    const numberOfBaseUnits = totalAmountInGrams / baseAmountInGrams;

    const basePricePerUnit = (price as number) / numberOfBaseUnits;
    return basePricePerUnit;
  };

  const handleOnVariantInfoChange = (
    value: SelectInputValue,
    fieldName: string,
  ) => {
    if (fieldName === 'total') {
      setUnitData((prev) => ({
        ...prev,
        total_unit_amount: value.value,
        total_unit: value.unit as string | null | undefined,
      }));
    } else {
      setUnitData((prev) => ({
        ...prev,
        base_unit_amount: value.value,
        base_unit: value.unit as string | null | undefined,
      }));
    }
  };

  const handleSaveUnitData = () => {
    onChange(unitData);
    setOpenUnitPopup(false);
  };

  const handleOnClose = () => {
    setUnitData((prev) => ({
      ...prev,
      total_unit_amount: data?.total_unit_amount,
      total_unit: data?.total_unit,
      base_unit_amount: data?.base_unit_amount,
      base_unit: data?.base_unit,
      price: data?.price,
    }));
    setOpenUnitPopup(false);
  };

  const btnText = basePricePerBaseUnitAmount()
    ? `${basePricePerBaseUnitAmount().toFixed(2)} / ${
        unitData.base_unit_amount
      }${unitData.base_unit}`
    : __('Add', 'kirki-ecommerce');

  return (
    <>
      <Button
        type="outlined"
        text={btnText}
        style={{ width: '240px' }}
        rightIcon={<ChevronDownIcon />}
        onClick={() => setOpenUnitPopup((prev) => !prev)}
        ref={popoverRef}
        size="fullWidth"
        contentStyle={{ justifyContent: 'space-between' }}
        {...buttonProps}
      />
      <DropdownMenuContent
        isOpen={openUnitPopup}
        triggerRef={popoverRef}
        onClose={() => setOpenUnitPopup(false)}
      >
        <Flex direction="column" gap={16} style={{ padding: '16px' }}>
          <Flex direction="column" gap={12}>
            <div ref={totalUnitAnchorRef}>
              <SelectInput
                label={__('Total unit in product', 'kirki-ecommerce')}
                min={0}
                value={{
                  value: unitData?.total_unit_amount || '',
                  unit: unitData?.total_unit ?? undefined,
                }}
                optionsArray={unitList as SelectOption[]}
                onChange={(value) => handleOnVariantInfoChange(value, 'total')}
                error={
                  (errors?.total_unit_amount || errors?.total_unit) as
                    | string
                    | boolean
                    | undefined
                }
                anchorRef={totalUnitAnchorRef}
                selectWidth="50%"
              />
            </div>
            <div ref={baseUnitAnchorRef}>
              <SelectInput
                label={__('Base unit', 'kirki-ecommerce')}
                min={0}
                value={{
                  value: unitData?.base_unit_amount || '',
                  unit: unitData?.base_unit ?? undefined,
                }}
                optionsArray={
                  getSpecifiedUnitList(unitData?.total_unit) as SelectOption[]
                }
                onChange={(value) => handleOnVariantInfoChange(value, 'base')}
                error={
                  (errors?.base_unit_amount || errors?.base_unit) as
                    | string
                    | boolean
                    | undefined
                }
                anchorRef={baseUnitAnchorRef}
                selectWidth="50%"
              />
            </div>
          </Flex>
          <Flex>
            <Button
              type="ghost"
              text={__('Cancel', 'kirki-ecommerce')}
              size="fullWidth"
              onClick={handleOnClose}
            />
            <Button
              type="primary"
              text={__('Okay', 'kirki-ecommerce')}
              size="fullWidth"
              state={basePricePerBaseUnitAmount() ? '' : 'disabled'}
              onClick={handleSaveUnitData}
            />
          </Flex>
        </Flex>
      </DropdownMenuContent>
    </>
  );
};

BaseUnitPopup.displayName = 'BaseUnitPopup';

export default BaseUnitPopup;
