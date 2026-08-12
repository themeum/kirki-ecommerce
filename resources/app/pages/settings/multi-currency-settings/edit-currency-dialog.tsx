import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Label from '@/components/ui/label';
import Text from '@/components/ui/text';
import { InfoIcon } from '@/icons';
import type { Currency } from '@/schemas/catalog/currency';
import { type EditCurrencyFormInput, type EditCurrencyFormPayload, EditCurrencyFormSchema } from '@/schemas/forms/edit-currency-form';
import { theme } from '@/theme';
import { __, sprintf } from '@/wpi18n';

type EditCurrencyItem = Currency & {
  icon?: string | null;
};

type EditCurrencyDialogProps = {
  editCurrency: EditCurrencyItem;
  setEditCurrency: Dispatch<SetStateAction<EditCurrencyItem | null>>;
  handleUpdateData: (currency: Currency) => void;
};

const EditCurrencyDialog = ({
  editCurrency,
  setEditCurrency,
  handleUpdateData,
}: EditCurrencyDialogProps) => {
  const form = useForm<EditCurrencyFormInput, unknown, EditCurrencyFormPayload>({
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

  const handleSubmit = (values: EditCurrencyFormPayload) => {
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
              <Label cssOverride={styles.ratePopupLabel}>
                <InfoIcon />
                {__('Enter rates per 1 USD', 'kirki-ecommerce')}
              </Label>
              <Flex direction="column" gap={3} cssOverride={{ maxHeight: '200px', overflowX: 'scroll' }}>
                <Flex justify="space-between">
                  <Flex gap={3}>
                    <Text weight="semibold">{sprintf(
                      __('%s', 'kirki-ecommerce'),
                      editCurrency?.icon ?? '',
                    )}</Text>
                    <Text variant="small" weight="medium">{sprintf(
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

EditCurrencyDialog.displayName = 'EditCurrencyDialog';

export default EditCurrencyDialog;

const styles = {
  ratePopupLabel: css({
    padding: theme.spacing[3],
    gap: theme.spacing[2],
    background: theme.colors.background.surfaceAlt,
    borderRadius: theme.radius.md,
    color: theme.colors.text.secondary,
  }),
};
