import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';
import { ArrowLeftIcon, InfoIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import {
  ExchangeRateFormSchema,
  type ExchangeRateFormValues,
} from '@/schemas/forms/exchange-rate-form';
import {
  useAvailableCurrenciesQuery,
  useCreateCurrencyMutation,
} from '@/services/currency';
import type { Currency, CurrencyFormData } from '@/types';
import { __, sprintf } from '@/wpi18n';

type ExchangeRatePopupProps = {
  selectedCurrencyList?: Currency[];
  setSelectedCurrencyList: Dispatch<SetStateAction<Currency[]>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setAddCurrencyPopup: Dispatch<SetStateAction<boolean>>;
  setSearchValue: Dispatch<SetStateAction<string>>;
};

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

  const form = useForm<ExchangeRateFormValues>({
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

  const handleSaveCurrencyData = async (values: ExchangeRateFormValues) => {
    const payload: CurrencyFormData = {
      items: values.items.map((item, idx) => ({
        ...item,
        is_base:
          availableCurrencyList?.length === 0 && idx === 0
            ? true
            : item?.is_base,
        is_active: true,
      })) as Currency[],
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
            <Flex gap={8} style={{ alignItems: 'center' }}>
              <ArrowLeftIcon />
              {__('Set Exchange Rates', 'kirki-ecommerce')}
            </Flex>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveCurrencyData)}>
            <div className={`${CLASS_PREFIX}-ui-dialog-body`}>
              <Flex direction="column" gap={16}>
                <Label
                  className={`${CLASS_PREFIX}-edit-currency-rate-popup-label`}
                  leftIcon={<InfoIcon />}
                >
                  {__('Enter rates per 1 USD', 'kirki-ecommerce')}
                </Label>
                <Flex
                  direction="column"
                  gap={16}
                  style={{
                    maxHeight: '200px',
                    overflowX: 'scroll',
                  }}
                >
                  {selectedCurrencyList?.length > 0 &&
                    selectedCurrencyList?.map((currency, index) => (
                      <Flex
                        key={index}
                        style={{ justifyContent: 'space-between' }}
                      >
                        <Flex gap={12}>
                          <Text
                            type="primary"
                            header={sprintf(
                              __('%s', 'kirki-ecommerce'),
                              currency?.symbol ?? '',
                            )}
                          />
                          <Text
                            type="secondary"
                            header={sprintf(
                              __('%s', 'kirki-ecommerce'),
                              currency?.code ?? '',
                            )}
                          />
                          <Text
                            type="xsm"
                            style={{ color: 'var(--decom-text-text-subdued)' }}
                            header={sprintf(
                              __('%s', 'kirki-ecommerce'),
                              currency?.name ?? '',
                            )}
                          />
                        </Flex>
                        <div
                          style={{
                            width: 'auto',
                            margin: 'var(--decom-spacing-f1)',
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
            </div>
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
