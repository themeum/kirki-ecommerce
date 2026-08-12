import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { type Dispatch, Fragment, type ReactNode, type SetStateAction, useEffect, useState } from 'react';
import { Controller, useForm, useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import {
  calculateBasePricePerUnit,
  DEFAULT_UNIT,
  getSpecifiedUnitList,
  getUnitShortText,
  unitGroups,
} from '@/pages/products/product-form/sections/price/utils';
import {
  type BaseUnitFormInput,
  type BaseUnitFormPayload,
  BaseUnitFormSchema,
  mapBaseUnitFromVariant,
} from '@/schemas/forms/base-unit-form';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import type { FormErrors, ProductVariant } from '@/types';
import { __ } from '@/wpi18n';

type BaseUnitPopupProps = {
  errors?: FormErrors;
  setErrors?: Dispatch<SetStateAction<FormErrors>>;
  data?: ProductVariant | null;
  currencySymbol?: string;
  onChange: (value: BaseUnitFormPayload) => void;
  buttonProps?: Record<string, unknown>;
};

type UnitAmountFieldProps = {
  label: string;
  infoText?: string;
  amountName: 'total_unit_amount' | 'base_unit_amount';
  unitName: 'total_unit' | 'base_unit';
  placeholder: string;
  onUnitChange: (value: string) => void;
  children: ReactNode;
};

const UnitAmountField = ({
  label,
  infoText,
  amountName,
  unitName,
  placeholder,
  onUnitChange,
  children,
}: UnitAmountFieldProps) => {
  const { control, clearErrors } = useFormContext<BaseUnitFormInput>();

  return (
    <Controller
      control={control}
      name={amountName}
      render={({ field: amountField, fieldState: amountState }) => (
        <Controller
          control={control}
          name={unitName}
          render={({ field: unitField, fieldState: unitState }) => {
            const hasError =
              Boolean(amountState.error) || Boolean(unitState.error);

            return (
              <Field data-invalid={hasError || undefined}>
                <FieldLabel htmlFor={amountName} infoText={infoText}>
                  {label}
                </FieldLabel>
                <InputGroup error={hasError}>
                  <InputGroupInput
                    id={amountName}
                    type="number"
                    min={0}
                    placeholder={placeholder}
                    value={amountField.value ?? ''}
                    onChange={(event) => {
                      amountField.onChange(event.target.value);
                      clearErrors([amountName, unitName]);
                    }}
                    onBlur={amountField.onBlur}
                    aria-invalid={amountState.invalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <Select
                      value={unitField.value ?? ''}
                      onValueChange={onUnitChange}
                    >
                      <SelectTrigger
                        id={unitName}
                        variant="invisible"
                        aria-invalid={unitState.invalid}
                        cssOverride={styles.unitTrigger}
                      >
                        <SelectValue>
                          {getUnitShortText(unitField.value)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>{children}</SelectContent>
                    </Select>
                  </InputGroupAddon>
                </InputGroup>
                {hasError && (
                  <FieldError errors={[amountState.error, unitState.error]} />
                )}
              </Field>
            );
          }}
        />
      )}
    />
  );
};

UnitAmountField.displayName = 'UnitAmountField';

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
    form.setValue('total_unit', value);

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

  const handleBaseUnitChange = (value: string) => {
    form.setValue('base_unit', value);
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
                amountName="total_unit_amount"
                unitName="total_unit"
                placeholder="5"
                onUnitChange={handleTotalUnitChange}
              >
                {unitGroups.map((group, index) => (
                  <Fragment key={group.heading}>
                    {index > 0 && <SelectSeparator />}
                    <SelectGroup>
                      <SelectLabel icon={group.leftIcon}>
                        {group.heading}
                      </SelectLabel>
                      {group.items.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value ?? ''}
                          endSlot={item.subText}
                        >
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </Fragment>
                ))}
              </UnitAmountField>
              <UnitAmountField
                label={__('Base unit', 'kirki-ecommerce')}
                infoText={__(
                  'The unit price is calculated for, e.g. set 100g to show the price per 100g, or 1kg to show the price per kg.',
                  'kirki-ecommerce',
                )}
                amountName="base_unit_amount"
                unitName="base_unit"
                placeholder="1"
                onUnitChange={handleBaseUnitChange}
              >
                {baseUnitOptions.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value ?? ''}
                    endSlot={item.subText}
                  >
                    {item.title}
                  </SelectItem>
                ))}
              </UnitAmountField>
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
  unitTrigger: {
    width: 'auto',
    minWidth: '64px',
    paddingRight: theme.spacing[2],
  },
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
