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
import {
  AddCurrencyDialogProvider,
  useAddCurrencyDialogContext,
} from '@/features/settings/multi-currency/contexts/add-currency-dialog-context';
import CurrencyOptionList from '@/features/settings/multi-currency/pages/add-currency-dialog/currency-option-list';
import CurrencySearchField from '@/features/settings/multi-currency/pages/add-currency-dialog/currency-search-field';
import { PlusIcon } from '@/icons';
import { __ } from '@/wpi18n';

const AddCurrencyDialogPanel = () => {
  const { form, openPopup, setOpenPopup, formSelected, handleClosePopup, handleSubmit } =
    useAddCurrencyDialogContext();

  return (
    <>
      <Button variant="outline" size="icon-sm" onClick={() => setOpenPopup(true)}>
        <PlusIcon />
      </Button>
      <Dialog
        open={openPopup}
        onOpenChange={(next) => {
          if (!next) {
            handleClosePopup();
          }
        }}
      >
        <DialogContent>
          <DialogCloseButton />
          <DialogHeader>
            <DialogTitle>{__('Select Additional Currencies', 'kirki-ecommerce')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogBody>
                <Flex direction="column" gap={4}>
                  <CurrencySearchField />
                  <CurrencyOptionList />
                </Flex>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    {__('Cancel', 'kirki-ecommerce')}
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!formSelected || formSelected.length === 0}
                >
                  {__('Done', 'kirki-ecommerce')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

AddCurrencyDialogPanel.displayName = 'AddCurrencyDialogPanel';

const AddCurrencyPopup = () => {
  return (
    <AddCurrencyDialogProvider>
      <AddCurrencyDialogPanel />
    </AddCurrencyDialogProvider>
  );
};

AddCurrencyPopup.displayName = 'AddCurrencyPopup';

export default AddCurrencyPopup;
