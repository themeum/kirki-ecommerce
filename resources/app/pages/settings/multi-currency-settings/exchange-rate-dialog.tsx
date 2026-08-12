import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Label from '@/components/ui/label';
import Text from '@/components/ui/text';
import { ArrowLeftIcon, InfoIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import type { CurrencyDraft } from '@/schemas/catalog/currency';
import { type ExchangeRateFormInput, type ExchangeRateFormPayload, ExchangeRateFormSchema } from '@/schemas/forms/exchange-rate-form';
import { type CurrencyBulkPayload, useAvailableCurrenciesQuery, useCreateCurrencyMutation } from '@/services/currency';
import { theme } from '@/theme';
import { __, sprintf } from '@/wpi18n';

type ExchangeRatePopupProps = {
  selectedCurrencyList?: CurrencyDraft[];
  setSelectedCurrencyList: Dispatch<SetStateAction<CurrencyDraft[]>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setAddCurrencyPopup: Dispatch<SetStateAction<boolean>>;
  setSearchValue: Dispatch<SetStateAction<string>>;
};

const editCurrencyRatePopupLabelCss = css({
  padding: theme.spacing[3],
  gap: theme.spacing[2],
  background: theme.colors.background.surfaceAlt,
  borderRadius: theme.radius.md,
  color: theme.colors.text.secondary,
});

const ExchangeRatePopup = ({
  selectedCurrencyList = [],
  setSelectedCurrencyList,
  isOpen,
  setIsOpen,
  setAddCurrencyPopup,
  setSearchValue,
}: ExchangeRatePopupProps) => {
  const { data: availableCurrencyList = [] } = useAvailableCurrenciesQuery({
    limit: -1,
  });
  const createMutation = useCreateCurrencyMutation();
  const isSubmitting = createMutation.isPending;

  const form = useForm<ExchangeRateFormInput, unknown, ExchangeRateFormPayload>({
    resolver: zodResolver(ExchangeRateFormSchema),
    defaultValues: {
      items: selectedCurrencyList || [],
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset({
      items: selectedCurrencyList || [],
    });
  }, [isOpen, selectedCurrencyList, form]);

  const handleSaveCurrencyData = async (values: ExchangeRateFormPayload) => {
    const payload: CurrencyBulkPayload = {
      items: values.items.map((item, idx) => ({
        ...item,
        is_base:
          availableCurrencyList?.length === 0 && idx === 0
            ? true
            : item?.is_base,
        is_active: true,
      })),
    };

    try {
      await createMutation.mutateAsync(payload);
      setIsOpen(false);
      setSelectedCurrencyList([]);
      setSearchValue('');
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleClosePopup = () => {
    setSelectedCurrencyList([]);
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
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
            <Flex gap={2} align="center">
              <ArrowLeftIcon />
              {__('Set Exchange Rates', 'kirki-ecommerce')}
            </Flex>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveCurrencyData)}>
            <DialogBody>
              <Flex direction="column" gap={4}>
                <Label cssOverride={editCurrencyRatePopupLabelCss}>
                  <InfoIcon />
                  {__('Enter rates per 1 USD', 'kirki-ecommerce')}
                </Label>
                <Flex direction="column" gap={4} cssOverride={{ maxHeight: '200px', overflowX: 'scroll' }}>
                  {selectedCurrencyList?.length > 0 &&
                    selectedCurrencyList?.map((currency, index) => (
                      <Flex
                        key={index}
                        justify="space-between">
                        <Flex gap={3}>
                          <Text weight="semibold">{sprintf(
                              __('%s', 'kirki-ecommerce'),
                              currency?.symbol ?? '',
                            )}</Text>
                          <Text weight="medium">{sprintf(
                              __('%s', 'kirki-ecommerce'),
                              currency?.code ?? '',
                            )}</Text>
                          <Text variant="small" color="subdued">{sprintf(
                              __('%s', 'kirki-ecommerce'),
                              currency?.name ?? '',
                            )}</Text>
                        </Flex>
                        <div
                          style={{
                            width: 'auto',
                            margin: theme.spacing[1],
                          }}
                        >
                          <TextField
                            name={`items.${index}.exchange_rate`}
                            placeholder={__('0.730', 'kirki-ecommerce')}
                          />
                        </div>
                      </Flex>
                    ))}
                </Flex>
              </Flex>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setIsOpen(false);
                  setAddCurrencyPopup(true);
                }}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ExchangeRatePopup.displayName = 'ExchangeRatePopup';

export default ExchangeRatePopup;
