import { Info } from 'lucide-react';
import { useFormState } from 'react-hook-form';

import NumberField from '@/components/form/number-field';
import Flex from '@/components/ui/flex';
import InfoTooltip from '@/components/ui/info-tooltip';
import Text from '@/components/ui/text';
import { useAddCurrencyDialogContext } from '@/features/settings/multi-currency/contexts/add-currency-dialog-context';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type CurrencyRateInputProps = {
  index: number;
  code: string;
};

const CurrencyRateInput = ({ index, code }: CurrencyRateInputProps) => {
  const { form } = useAddCurrencyDialogContext();
  const { errors } = useFormState({
    control: form.control,
    name: `selectedCurrencies.${index}.exchange_rate`,
  });
  const error = errors.selectedCurrencies?.[index]?.exchange_rate;

  return (
    <InfoTooltip infoText={error?.message} position="top" iconPosition="right" variant="critical">
      <NumberField
        name={`selectedCurrencies.${index}.exchange_rate`}
        min={0}
        aria-label={sprintf(__('Exchange rate for %s', 'kirki-ecommerce'), code)}
        cssOverride={styles.rateInput}
        placeholder="1.00"
        showError={false}
      />
    </InfoTooltip>
  );
};

CurrencyRateInput.displayName = 'CurrencyRateInput';

const CurrencyRateList = () => {
  const { formSelected, baseCurrencyCode } = useAddCurrencyDialogContext();

  return (
    <Flex direction="column" gap={4}>
      <Flex gap={2} align="center" cssOverride={styles.banner}>
        <Info size={16} />
        <Text variant="small" color="secondary">
          {sprintf(__('Enter rates per 1 %s', 'kirki-ecommerce'), baseCurrencyCode)}
        </Text>
      </Flex>
      <Flex direction="column" gap={3} cssOverride={styles.list}>
        {formSelected?.map((currency, index) => (
          <Flex key={currency.code} gap={3} align="center" justify="space-between">
            <Flex gap={3} align="center">
              <span css={scoped(styles.flag)}>{currency.flag}</span>
              <Text weight="medium">{currency.code}</Text>
              <Text variant="small" color="subdued">
                {currency.name}
              </Text>
            </Flex>
            <CurrencyRateInput index={index} code={currency.code} />
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};

CurrencyRateList.displayName = 'CurrencyRateList';

export default CurrencyRateList;

const styles = defineStyles({
  banner: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surfaceAlt,
  },
  list: {
    maxHeight: '240px',
    overflowY: 'auto',
  },
  flag: {
    display: 'inline-block',
    fontSize: 20,
    textAlign: 'center',
  },
  rateInput: {
    width: '120px',
    '& input:focus-visible': {
      boxShadow: 'none',
    },
  },
});
