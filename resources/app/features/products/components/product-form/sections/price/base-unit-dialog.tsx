import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import UnitAmountField from '@/components/form/unit-amount-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import {
  calculateBasePricePerUnit,
  DEFAULT_UNIT,
  getSpecifiedUnitList,
  getUnitShortText,
  unitGroups,
} from '@/features/products/lib/price/utils';
import type { ProductVariant } from '@/features/products/schemas/catalog/variant';
import {
  type BaseUnitFormInput,
  type BaseUnitFormPayload,
  BaseUnitFormSchema,
  mapBaseUnitFromVariant,
} from '@/features/products/schemas/forms/base-unit-form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import type { FormErrors } from '@/types/pages/common';
import { __ } from '@/wpi18n';

type BaseUnitPopupProps = {
  errors?: FormErrors;
  setErrors?: Dispatch<SetStateAction<FormErrors>>;
  data?: ProductVariant | null;
  currencySymbol?: string;
  onChange: (value: BaseUnitFormPayload) => void;
  buttonProps?: Record<string, unknown>;
};

const getInitialValues = (data?: ProductVariant | null): BaseUnitFormInput => {
  const values = mapBaseUnitFromVariant(data ?? undefined);

  return {
    ...values,
    total_unit: values.total_unit ?? DEFAULT_UNIT,
    base_unit: values.base_unit ?? DEFAULT_UNIT,
  };
};

const BaseUnitDialog = ({
  errors = {},
  onChange,
  buttonProps,
  data,
  currencySymbol = '$',
}: BaseUnitPopupProps) => {
  const [openUnitPopup, setOpenUnitPopup] = useState(false);

  const form = useForm<BaseUnitFormInput, unknown, BaseUnitFormPayload>({
    resolver: zodResolver(BaseUnitFormSchema),
    defaultValues: getInitialValues(data),
  });

  const unitData = form.watch();

  useEffect(() => {
    const hasErrors = Object.values(errors).some(Boolean);
    if (!hasErrors) {
      return;
    }
    applyServerErrors(form, { errors } as ErrorResponse, {
      stripPrefix: 'variants.0.',
    });
  }, [errors, form]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      form.reset(getInitialValues(data));
    }
    setOpenUnitPopup(next);
  };

  const handleSaveUnitData = (payload: BaseUnitFormPayload) => {
    onChange(payload);
    setOpenUnitPopup(false);
  };

  const handleTotalUnitChange = (value: string) => {
    const nextBaseUnitOptions = getSpecifiedUnitList(value);
    if (
      !nextBaseUnitOptions.some(
        (item) => item.value === form.getValues('base_unit'),
      )
    ) {
      form.setValue('base_unit', value);
    }

    form.clearErrors(['total_unit_amount', 'total_unit', 'base_unit']);
  };

  const handleBaseUnitChange = () => {
    form.clearErrors(['base_unit_amount', 'base_unit']);
  };

  const savedBasePricePerUnit = calculateBasePricePerUnit(data ?? {});

  const btnText =
    savedBasePricePerUnit === null
      ? __('Add', 'kirki-ecommerce')
      : `${currencySymbol}${savedBasePricePerUnit.toFixed(2)} / ${data?.base_unit_amount}${getUnitShortText(data?.base_unit)}`;

  const baseUnitOptions = getSpecifiedUnitList(unitData.total_unit);

  return (
    <Dialog open={openUnitPopup} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          cssOverride={{ width: 240, height: 36, justifyContent: 'space-between' }}
          {...buttonProps}
        >
          {btnText}
          <ChevronDown width={16} height={16} css={scoped({ color: theme.colors.icon.secondary })} />
        </Button>
      </DialogTrigger>
      <DialogContent cssOverride={{ width: '340px' }}>
        <Form {...form}>
          <DialogTitle cssOverride={styles.visuallyHiddenTitle}>
            {__('Base price per unit', 'kirki-ecommerce')}
          </DialogTitle>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <UnitAmountField
                label={__('Total unit in product', 'kirki-ecommerce')}
                infoText={__(
                  'The total quantity contained in this product, e.g. 500g or 1kg for a bag of rice, 1l for a bottle of oil.',
                  'kirki-ecommerce',
                )}
                name="total_unit_amount"
                unitName="total_unit"
                placeholder="5"
                unitShortText={(value) => getUnitShortText(value as string)}
                onUnitChange={handleTotalUnitChange}
                unitOptions={unitGroups.map((group) => ({
                  heading: group.heading,
                  icon: group.leftIcon,
                  items: group.items.map((item) => ({
                    value: item.value ?? '',
                    label: item.title ?? '',
                    endSlot: item.subText,
                  })),
                }))}
              />
              <UnitAmountField
                label={__('Base unit', 'kirki-ecommerce')}
                infoText={__(
                  'The unit price is calculated for, e.g. set 100g to show the price per 100g, or 1kg to show the price per kg.',
                  'kirki-ecommerce',
                )}
                name="base_unit_amount"
                unitName="base_unit"
                placeholder="1"
                unitShortText={(value) => getUnitShortText(value as string)}
                onUnitChange={handleBaseUnitChange}
                unitOptions={baseUnitOptions.map((item) => ({
                  value: item.value ?? '',
                  label: item.title ?? '',
                  endSlot: item.subText,
                }))}
              />
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenUnitPopup(false)}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              disabled={calculateBasePricePerUnit(unitData) === null}
              onClick={form.handleSubmit(handleSaveUnitData)}
            >
              {__('Okay', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

BaseUnitDialog.displayName = 'BaseUnitDialog';

export default BaseUnitDialog;

const styles = defineStyles({
  visuallyHiddenTitle: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
});
