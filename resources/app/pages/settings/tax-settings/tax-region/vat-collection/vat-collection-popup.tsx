import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Button from '@/molecules/button';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { Select } from '@/molecules/select';
import {
  VatCollectionFormSchema,
  type VatCollectionFormValues,
} from '@/schemas/forms/vat-collection-form';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import type { TaxRate } from '@/pages/settings/tax-settings/utils';

type VatStateOption = SelectOption & {
  leftIcon?: ReactNode;
};

type VatCollectionPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  statesOption: VatStateOption[];
  onAdd: (item: TaxRate, index?: number | null) => void;
  editIndex: number | null;
  setEditIndex: (index: number | null) => void;
  vatCollectionList: TaxRate[];
};

const VatCollectionPopup = (props: VatCollectionPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    statesOption,
    onAdd,
    editIndex,
    setEditIndex,
    vatCollectionList,
  } = props;

  const form = useForm<VatCollectionFormValues>({
    resolver: zodResolver(VatCollectionFormSchema),
    defaultValues: {
      state: '',
      rate: '',
      flag: '',
    },
  });

  const stateValue = form.watch('state');
  const rateValue = form.watch('rate');

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    if (typeof editIndex === 'number' && vatCollectionList?.[editIndex]) {
      const item = vatCollectionList[editIndex];
      form.reset({
        state: String(item.state),
        rate: item.rate,
        flag: item.flag || '',
      });
      return;
    }

    form.reset({ state: '', rate: '', flag: '' });
  }, [editIndex, vatCollectionList, openPopup, form]);

  const handleClose = () => {
    setOpenPopup(false);
    setEditIndex(null);
  };

  const handleSubmit = (values: VatCollectionFormValues) => {
    onAdd(
      {
        state: values.state,
        rate: values.rate,
        flag: values.flag,
      },
      editIndex,
    );
    setOpenPopup(false);
  };

  const buttonState = stateValue === '' || rateValue === '';

  return (
    <Popover isOpen={openPopup} style={{ width: '400px' }}>
      <PopoverHeader
        style={{ padding: 'var(--decom-spacing-5)' }}
        onClose={handleClose}
      >
        {__('Collect VAT', 'kirki-ecommerce')}
      </PopoverHeader>
      <Form {...form}>
        <PopoverBody
          style={{
            padding:
              'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
            gap: 'var(--decom-spacing-4)',
          }}
        >
          <FormField
            control={form.control}
            name="state"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{__('Select country', 'kirki-ecommerce')}</FormLabel>
                <Select
                  optionsArray={statesOption}
                  value={field.value}
                  onChange={(value) => {
                    const nextValue = Array.isArray(value) ? value[0] : value;
                    field.onChange(nextValue ?? '');
                  }}
                  error={fieldState.error?.message}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <TextField
            name="rate"
            label={__('VAT (%)', 'kirki-ecommerce')}
            placeholder="e.g. 20%"
          />
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__('Cancel', 'kirki-ecommerce')}
            size="small"
            onClick={handleClose}
          />
          <Button
            type="primary"
            text={
              typeof editIndex === 'number'
                ? __('Update', 'kirki-ecommerce')
                : __('Done', 'kirki-ecommerce')
            }
            size="small"
            onClick={form.handleSubmit(handleSubmit)}
            state={buttonState ? 'disabled' : ''}
          />
        </PopoverFooter>
      </Form>
    </Popover>
  );
};

VatCollectionPopup.displayName = 'VatCollectionPopup';

export default VatCollectionPopup;
