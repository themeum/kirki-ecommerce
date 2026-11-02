import { ArrowLeftIcon, ArrowRightIcon, PlusIcon } from 'lucide-react';
import { useEffect } from 'react';

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
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import {
  AddCurrencyDialogProvider,
  useAddCurrencyDialogContext,
} from '@/features/settings/multi-currency/contexts/add-currency-dialog-context';
import CurrencyOptionList from '@/features/settings/multi-currency/pages/add-currency-dialog/currency-option-list';
import CurrencyRateList from '@/features/settings/multi-currency/pages/add-currency-dialog/currency-rate-list';
import CurrencySearchField from '@/features/settings/multi-currency/pages/add-currency-dialog/currency-search-field';
import { theme } from '@/theme';
import { __ } from '@/wpi18n';

type AddCurrencyDialogPanelProps = {
  onOpenChange?: (open: boolean) => void;
};

const AddCurrencyDialogPanel = ({ onOpenChange }: AddCurrencyDialogPanelProps) => {
  const {
    form,
    openPopup,
    setOpenPopup,
    formSelected,
    handleClosePopup,
    handleSubmit,
    handleCloseAutoFocus,
    step,
    handleNext,
    handleBack,
  } = useAddCurrencyDialogContext();

  useEffect(() => {
    onOpenChange?.(openPopup);
  }, [openPopup, onOpenChange]);

  const isRatesStep = step === 'rates';

  return (
    <>
      <Button variant="outline" size="icon-sm" onClick={() => setOpenPopup(true)}>
        <PlusIcon size={16} />
      </Button>
      <Dialog
        open={openPopup}
        onOpenChange={(next) => {
          if (!next) {
            handleClosePopup();
          }
        }}
      >
        <DialogContent onCloseAutoFocus={handleCloseAutoFocus}>
          <DialogCloseButton />
          <DialogHeader cssOverride={{ flexDirection: 'row', gap: theme.spacing[1] }}>
            {isRatesStep && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={__('Back', 'kirki-ecommerce')}
                onClick={handleBack}
              >
                <ArrowLeftIcon size={16} />
              </Button>
            )}
            <DialogTitle>
              <Text variant="heading6" weight="semibold">
                {isRatesStep
                  ? __('Set Exchange Rates', 'kirki-ecommerce')
                  : __('Select Additional Currencies', 'kirki-ecommerce')}
              </Text>
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogBody>
                {isRatesStep ? (
                  <CurrencyRateList />
                ) : (
                  <Flex direction="column" gap={4}>
                    <CurrencySearchField />
                    <CurrencyOptionList />
                  </Flex>
                )}
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    {__('Cancel', 'kirki-ecommerce')}
                  </Button>
                </DialogClose>
                {isRatesStep ? (
                  <Button key="save" type="submit" variant="primary">
                    {__('Save', 'kirki-ecommerce')}
                  </Button>
                ) : (
                  <Button
                    key="next"
                    type="button"
                    variant="primary"
                    disabled={!formSelected || formSelected.length === 0}
                    onClick={handleNext}
                  >
                    <ArrowRightIcon size={16} />
                    {__('Next', 'kirki-ecommerce')}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

AddCurrencyDialogPanel.displayName = 'AddCurrencyDialogPanel';

const AddCurrencyPopup = ({ onOpenChange }: AddCurrencyDialogPanelProps) => {
  return (
    <AddCurrencyDialogProvider>
      <AddCurrencyDialogPanel onOpenChange={onOpenChange} />
    </AddCurrencyDialogProvider>
  );
};

AddCurrencyPopup.displayName = 'AddCurrencyPopup';

export default AddCurrencyPopup;
