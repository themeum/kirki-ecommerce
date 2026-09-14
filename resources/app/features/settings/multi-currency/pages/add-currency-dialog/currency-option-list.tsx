import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import Text from '@/components/ui/text';
import { useAddCurrencyDialogContext } from '@/features/settings/multi-currency/contexts/add-currency-dialog-context';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

const CurrencyOptionList = () => {
  const { filteredCurrency, formSelected, handleSelectCurrencies } = useAddCurrencyDialogContext();

  return (
    <Flex direction="column" gap={3} cssOverride={{ height: '200px', overflowX: 'scroll' }}>
      {filteredCurrency?.length > 0 &&
        filteredCurrency.map((currency, index) => (
          <Label htmlFor={`add-currency-checkbox-${index}`} key={index}>
            <Flex key={index} gap={3} cssOverride={{ width: '100%', cursor: 'pointer' }}>
              <Flex gap={2} align="center">
                <Checkbox
                  id={`add-currency-checkbox-${index}`}
                  checked={formSelected?.some((c) => c.name === currency.name)}
                  onCheckedChange={() => handleSelectCurrencies(currency)}
                />
                {currency.code}
              </Flex>
              <Flex justify="space-between" cssOverride={{ width: '100%', cursor: 'pointer' }}>
                <Text
                  variant="small"
                  style={{
                    color: theme.colors.text.subdued,
                  }}
                >
                  {currency.name}
                </Text>
                <Text weight="semibold" cssOverride={styles.symbolText}>
                  {currency.symbol}
                </Text>
              </Flex>
            </Flex>
          </Label>
        ))}
    </Flex>
  );
};

CurrencyOptionList.displayName = 'CurrencyOptionList';

export default CurrencyOptionList;

const styles = defineStyles({
  symbolText: {
    paddingRight: theme.spacing[3],
  },
});
