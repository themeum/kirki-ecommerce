import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaxRate } from '@/features/settings/tax/lib/utils';
import {
  type VatCollectionFormInput,
  type VatCollectionFormPayload,
  VatCollectionFormSchema,
} from '@/schemas/forms/vat-collection-form';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

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

  const form = useForm<VatCollectionFormInput, unknown, VatCollectionFormPayload>({
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

  const handleSubmit = (payload: VatCollectionFormPayload) => {
    onAdd(payload, editIndex);
    setOpenPopup(false);
  };

  const buttonState = stateValue === '' || rateValue === '';

  return (
    <Dialog
      open={openPopup}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <DialogContent style={{ width: '400px' }}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{__('Collect VAT', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Controller
              control={form.control}
              name="state"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="state">
                    {__('Select country', 'kirki-ecommerce')}
                  </FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger
                      id="state"
                      error={Boolean(fieldState.error)}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statesOption.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                        >
                          {option.leftIcon}
                          {option.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <TextField
              name="rate"
              label={__('VAT (%)', 'kirki-ecommerce')}
              placeholder="e.g. 20%"
            />
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={buttonState}
            >
              {typeof editIndex === 'number'
                ? __('Update', 'kirki-ecommerce')
                : __('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

VatCollectionPopup.displayName = 'VatCollectionPopup';

export default VatCollectionPopup;
