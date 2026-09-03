import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import InputGroupField from '@/components/form/input-group-field';
import SelectField from '@/components/form/select-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { InputGroupText } from '@/components/ui/input-group';
import type { CountryTaxRate } from '@/features/settings/tax/lib/utils';
import {
  type VatCollectionFormInput,
  type VatCollectionFormPayload,
  VatCollectionFormSchema,
} from '@/features/settings/tax/schemas/forms/vat-collection-form';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

type VatCountryOption = SelectOption & {
  leftIcon?: ReactNode;
};

type VatCollectionPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  countryOptions: VatCountryOption[];
  onAdd: (item: CountryTaxRate, index?: number | null) => void;
  editIndex: number | null;
  setEditIndex: (index: number | null) => void;
  vatCollectionList: CountryTaxRate[];
};

const VatCollectionPopup = (props: VatCollectionPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    countryOptions,
    onAdd,
    editIndex,
    setEditIndex,
    vatCollectionList,
  } = props;

  const form = useForm<VatCollectionFormInput, unknown, VatCollectionFormPayload>({
    resolver: zodResolver(VatCollectionFormSchema),
    defaultValues: {
      code: '',
      name: '',
      flag: '',
      rate: '',
    },
  });

  const codeValue = form.watch('code');
  const rateValue = form.watch('rate');

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    if (typeof editIndex === 'number' && vatCollectionList?.[editIndex]) {
      const item = vatCollectionList[editIndex];
      form.reset({
        code: String(item.code),
        name: item.name ?? '',
        flag: item.flag ?? '',
        rate: item.rate ?? '',
      });
      return;
    }

    form.reset({ code: '', name: '', flag: '', rate: '' });
  }, [editIndex, vatCollectionList, openPopup, form]);

  const handleClose = () => {
    setOpenPopup(false);
    setEditIndex(null);
  };

  /**
   * The picked country's name and flag are resolved from the option list at
   * submit time — the form only ever binds the code.
   */
  const handleSubmit = (payload: VatCollectionFormPayload) => {
    const option = countryOptions.find((item) => String(item.value) === payload.code);

    onAdd(
      {
        ...payload,
        name: option?.title ?? payload.name,
        flag: (option?.leftIcon as string | undefined) ?? payload.flag,
      },
      editIndex,
    );
    setOpenPopup(false);
  };

  const buttonState = codeValue === '' || rateValue === '';

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
            <SelectField
              name="code"
              label={__('Select country', 'kirki-ecommerce')}
              placeholder={__('Select', 'kirki-ecommerce')}
              options={countryOptions.map((option) => ({
                value: String(option.value),
                label: String(option.title),
                icon: option.leftIcon,
              }))}
            />
            <InputGroupField
              name="rate"
              type="number"
              min={0}
              max={100}
              label={__('VAT (%)', 'kirki-ecommerce')}
              placeholder="e.g. 20"
              endContent={<InputGroupText>%</InputGroupText>}
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
