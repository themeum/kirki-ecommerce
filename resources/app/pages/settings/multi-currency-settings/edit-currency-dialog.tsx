import { css } from '@emotion/react';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import Label from '@/components/ui/label';
import { InfoIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import Text from '@/components/ui/text';
import {
  EditCurrencyFormSchema,
  type EditCurrencyFormValues,
} from '@/schemas/forms/edit-currency-form';
import type { Currency } from '@/types';
import { __, sprintf } from '@/wpi18n';

type EditCurrencyItem = Currency & {
  icon?: string;
};

type EditCurrencyPopupProps = {
  editCurrency: EditCurrencyItem;
  setEditCurrency: Dispatch<SetStateAction<EditCurrencyItem | null>>;
  handleUpdateData: (currency: Currency) => void;
};

const EditCurrencyPopup = ({
  editCurrency,
  setEditCurrency,
  handleUpdateData,
}: EditCurrencyPopupProps) => {
  const form = useForm<EditCurrencyFormValues>({
    resolver: zodResolver(EditCurrencyFormSchema),
    defaultValues: {
      exchange_rate: editCurrency?.exchange_rate ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      exchange_rate: editCurrency?.exchange_rate ?? '',
    });
  }, [editCurrency, form]);

  const handleClosePopup = () => {
    setEditCurrency(null);
  };

  const handleSubmit = (values: EditCurrencyFormValues) => {
    handleUpdateData({
      ...editCurrency,
      exchange_rate: values.exchange_rate,
    });
    setEditCurrency(null);
  };

  return (
    <Dialog
      open={editCurrency ? true : false}
      onOpenChange={(next) => {
        if (!next) {
          handleClosePopup();
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {__('Update Exchange Rates', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogBody>
              <Label css={styles.ratePopupLabel}>
                <InfoIcon />
                {__('Enter rates per 1 USD', 'kirki-ecommerce')}
              </Label>
              <Flex direction="column" gap={3} css={css({ maxHeight: '200px', overflowX: 'scroll' })}>
                <Flex justify="space-between">
                  <Flex gap={3}>
                    <Text weight="semibold">{sprintf(
                        __('%s', 'kirki-ecommerce'),
                        editCurrency?.icon ?? '',
                      )}</Text>
                    <Text weight="medium">{sprintf(
                        __('%s', 'kirki-ecommerce'),
                        editCurrency?.code ?? '',
                      )}</Text>
                    <Text variant="small">{sprintf(
                        __('%s', 'kirki-ecommerce'),
                        editCurrency?.name ?? '',
                      )}</Text>
                  </Flex>
                  <div
                    style={{ width: 'auto', margin: theme.spacing[1] }}
                  >
                    <TextField
                      name="exchange_rate"
                      placeholder={__('0.730', 'kirki-ecommerce')}
                    />
                  </div>
                </Flex>
              </Flex>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
              </DialogClose>
              <Button type="submit" variant="primary">
                {__('Update', 'kirki-ecommerce')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

EditCurrencyPopup.displayName = 'EditCurrencyPopup';

export default EditCurrencyPopup;

const styles = {
  ratePopupLabel: css({
    padding: theme.spacing[3],
    gap: theme.spacing[2],
    background: theme.colors.background.surfaceAlt,
    borderRadius: theme.radius.md,
    color: theme.colors.text.secondary,
  }),
};
