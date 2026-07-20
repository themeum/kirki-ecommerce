import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLASS_PREFIX } from '@/conf';
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
          <div className={`${CLASS_PREFIX}-ui-dialog-body`}>
            <FormField
              control={form.control}
              name="state"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    {__('Select country', 'kirki-ecommerce')}
                  </FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger error={Boolean(fieldState.error)}>
                        <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <TextField
              name="rate"
              label={__('VAT (%)', 'kirki-ecommerce')}
              placeholder="e.g. 20%"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              size="sm"
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
