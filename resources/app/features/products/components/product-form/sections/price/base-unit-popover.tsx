import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import {
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';

import UnitAmountField from '@/components/form/unit-amount-field';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { __, sprintf } from '@/wpi18n';

type BaseUnitPopoverProps = {
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

const BaseUnitPopover = ({
  errors = {},
  onChange,
  buttonProps,
  data,
  currencySymbol = '$',
}: BaseUnitPopoverProps) => {
  const [openUnitPopover, setOpenUnitPopover] = useState(false);

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
    setOpenUnitPopover(next);
  };

  const handleSaveUnitData = (payload: BaseUnitFormPayload) => {
    onChange(payload);
    setOpenUnitPopover(false);
  };

  const handleTotalUnitChange = (value: string) => {
    const nextBaseUnitOptions = getSpecifiedUnitList(value);
    if (!nextBaseUnitOptions.some((item) => item.value === form.getValues('base_unit'))) {
      form.setValue('base_unit', value);
    }

    form.clearErrors(['total_unit_amount', 'total_unit', 'base_unit']);
  };

  const handleBaseUnitChange = () => {
    form.clearErrors(['base_unit_amount', 'base_unit']);
  };

  /**
   * React routes portalled events through the React tree, not the DOM tree, so
   * a mousedown inside this panel still reaches whatever rendered the trigger.
   * In the bulk-edit grid that is a `<td>` whose own mousedown handler starts a
   * cell selection, which then pulls DOM focus onto the cell — and a non-modal
   * popover dismisses on focus leaving it, so the panel closed the moment it
   * was clicked. Radix's own outside-detection listens for `pointerdown` and
   * `focusin`, never `mousedown`, so containing this one leaves genuine
   * outside-clicks dismissing the popover exactly as before.
   */
  const handleContentMouseDown = (event: ReactMouseEvent) => {
    event.stopPropagation();
  };

  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault();

    const content = event.currentTarget;

    if (!(content instanceof HTMLElement)) {
      return;
    }

    content.querySelector('input')?.focus();
  };

  const savedBasePricePerUnit = calculateBasePricePerUnit(data ?? {});

  const btnText =
    savedBasePricePerUnit === null
      ? __('Add', 'kirki-ecommerce')
      : sprintf(
          '%s%s / %s%s',
          currencySymbol,
          savedBasePricePerUnit.toFixed(2),
          data?.base_unit_amount ?? '',
          data?.base_unit ?? '',
        );

  const baseUnitOptions = getSpecifiedUnitList(unitData.total_unit);

  return (
    <Popover open={openUnitPopover} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          cssOverride={{ width: 240, height: 36, justifyContent: 'space-between' }}
          {...buttonProps}
        >
          {btnText}
          <ChevronDown
            width={16}
            height={16}
            css={scoped({ color: theme.colors.icon.secondary })}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        cssOverride={styles.content}
        onOpenAutoFocus={handleOpenAutoFocus}
        onMouseDown={handleContentMouseDown}
      >
        <Form {...form}>
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
            <Flex gap={2} justify="flex-end">
              <Button variant="ghost" onClick={() => setOpenUnitPopover(false)}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                disabled={calculateBasePricePerUnit(unitData) === null}
                onClick={form.handleSubmit(handleSaveUnitData)}
              >
                {__('Okay', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </Flex>
        </Form>
      </PopoverContent>
    </Popover>
  );
};

BaseUnitPopover.displayName = 'BaseUnitPopover';

export default BaseUnitPopover;

const styles = defineStyles({
  content: {
    width: '340px',
    maxWidth: '340px',
    padding: theme.spacing[4],
  },
});
