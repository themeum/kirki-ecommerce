import { useMemo } from 'react';

import Combobox from '@/components/ui/combobox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import type { LabelFieldProps } from '@/types/components/common';
import { __ } from '@/wpi18n';

type CountrySelectorProps = LabelFieldProps & {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
};

const CountrySelector = ({
  label,
  helpText,
  value,
  onChange,
  error,
  multiple = false,
  disabled,
}: CountrySelectorProps) => {
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });

  const options = useMemo(() => {
    return countries.map((country) => ({
      value: country.code,
      label: country.name,
      leftIcon: country.flag ? <span css={scoped(styles.flag)}>{country.flag}</span> : undefined,
    }));
  }, [countries]);

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel>{label || __('Country / Region', 'kirki-ecommerce')}</FieldLabel>
      <Combobox
        options={options}
        value={value}
        onChange={onChange}
        error={Boolean(error)}
        multiple={multiple}
        listCss={styles.wrapper}
        disabled={disabled}
        virtualized
      />

      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
};

CountrySelector.displayName = 'CountrySelector';

export default CountrySelector;

const styles = defineStyles({
  wrapper: {
    maxHeight: '220px',
    overflowY: 'auto',
    overflowX: 'hidden',
    borderTop: `1px solid ${theme.colors.border.muted}`,
    borderBottom: `1px solid ${theme.colors.border.muted}`,
  },
  searchInput: {
    padding: theme.spacing[3],
  },
  flag: {
    fontSize: '16px',
    lineHeight: 1,
  },
});
