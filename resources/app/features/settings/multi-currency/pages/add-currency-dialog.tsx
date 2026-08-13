import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Text from '@/components/ui/text';
import { useAddCurrencyDialog } from '@/features/settings/multi-currency/hooks/use-add-currency-dialog';
import ExchangeRatePopup from '@/features/settings/multi-currency/pages/exchange-rate-dialog';
import { PlusIcon, SearchIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const AddCurrencyPopup = () => {
  const {
    form,
    openPopup,
    setOpenPopup,
    openExchangePopup,
    setOpenExchangePopup,
    selectedCurrencyList,
    setSelectedCurrencyList,
    searchValue,
    setSearchValue,
    filteredCurrency,
    formSelected,
    handleSelectCurrencies,
    handleSearchCurrency,
    handleClosePopup,
    handleSubmit,
  } = useAddCurrencyDialog();

  return (
    <>
      <Button variant="secondary" onClick={() => setOpenPopup(true)} disabled>
        <PlusIcon />
        {__('Add Currency', 'kirki-ecommerce')}
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
            <DialogTitle>
              {__('Select Additional Currencies', 'kirki-ecommerce')}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogBody>
                <Flex direction="column" gap={4}>
                  <div>
                    <Label htmlFor="add-currency-search">
                      {__('Search currency', 'kirki-ecommerce')}
                    </Label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: theme.spacing[3],
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      >
                        <SearchIcon />
                      </span>
                      <Input
                        id="add-currency-search"
                        type="search"
                        value={searchValue}
                        placeholder={__(
                          'e.g United States',
                          'kirki-ecommerce',
                        )}
                        onChange={(e) => handleSearchCurrency(e)}
                        cssOverride={styles.searchInput}
                      />
                    </div>
                  </div>

                  <Flex direction="column" gap={3} cssOverride={{ height: '200px', overflowX: 'scroll' }}>
                    {filteredCurrency?.length > 0 &&
                      filteredCurrency.map((currency, index) => (
                        <Flex
                          key={index}
                          gap={3}
                          onClick={() => handleSelectCurrencies(currency)}
                          cssOverride={{ cursor: 'pointer' }}
                        >
                          <Flex gap={2} align="center">
                            <Checkbox
                              id={`add-currency-checkbox-${index}`}
                              checked={formSelected?.some(
                                (c) => c.name === currency.name,
                              )}
                              onCheckedChange={() =>
                                handleSelectCurrencies(currency)
                              }
                            />
                            <Label
                              htmlFor={`add-currency-checkbox-${index}`}
                            >
                              {currency.code}
                            </Label>
                          </Flex>
                          <Flex justify="space-between" cssOverride={{ width: '100%' }}>
                            <Text variant="small" style={{
                              color: theme.colors.text.subdued,
                            }}>{currency.name}</Text>
                            <Text weight="semibold" cssOverride={styles.symbolText}>{currency.symbol}</Text>
                          </Flex>
                        </Flex>
                      ))}
                  </Flex>
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
                  {__('Next', 'kirki-ecommerce')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {openExchangePopup && (
        <ExchangeRatePopup
          selectedCurrencyList={selectedCurrencyList}
          setSelectedCurrencyList={setSelectedCurrencyList}
          isOpen={openExchangePopup}
          setIsOpen={setOpenExchangePopup}
          setAddCurrencyPopup={setOpenPopup}
          setSearchValue={setSearchValue}
        />
      )}
    </>
  );
};

AddCurrencyPopup.displayName = 'AddCurrencyPopup';

export default AddCurrencyPopup;

const styles = defineStyles({
  searchInput: {
    paddingLeft: theme.spacing[8],
  },
  symbolText: {
    paddingRight: theme.spacing[3],
  },
});
