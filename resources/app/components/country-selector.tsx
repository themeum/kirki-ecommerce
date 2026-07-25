import Combobox from '@/components/ui/combobox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { useCountriesQuery } from '@/services/country';
import type { LabelFieldProps } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CountrySelectorProps = LabelFieldProps & {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
};

const CountrySelector = ({
  label,
  helpText,
  value,
  onChange,
  error,
  multiple = false,
}: CountrySelectorProps) => {
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });

  const options = countries.map((country) => ({
    value: country.code,
    label: country.name,
  }));

  return (
    <Flex direction="column" gap={2}>
      <Label error={Boolean(error)} helpText={error || helpText}>
        {label || __('Country / Region', 'kirki-ecommerce')}
      </Label>
      <Combobox
        options={options}
        value={value}
        onChange={onChange}
        error={Boolean(error)}
        multiple={multiple}
        listCss={styles.wrapper}
        searchInputCss={styles.searchInput}
      />
    </Flex>
  );
};

CountrySelector.displayName = 'CountrySelector';

export default CountrySelector;

const styles = {
  wrapper: scoped({
    height: '220px',
    overflowY: 'scroll',
    overflowX: 'hidden',
    borderTop: `1px solid ${theme.colors.border.muted}`,
    borderBottom: `1px solid ${theme.colors.border.muted}`,
  }),
  searchInput: scoped({
    padding: theme.spacing[3],
  }),
};
