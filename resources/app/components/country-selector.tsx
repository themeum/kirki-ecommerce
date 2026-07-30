import type { CSSObject } from '@emotion/react';
import Combobox from '@/components/ui/combobox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useCountriesQuery } from '@/services/country';
import type { LabelFieldProps } from '@/types';
import { theme } from '@/theme';
;
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
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel>
        {label || __('Country / Region', 'kirki-ecommerce')}
      </FieldLabel>
      <Combobox
        options={options}
        value={value}
        onChange={onChange}
        error={Boolean(error)}
        multiple={multiple}
        listCss={styles.wrapper}
        searchInputCss={styles.searchInput}
      />
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
};

CountrySelector.displayName = 'CountrySelector';

export default CountrySelector;

const styles = {
  wrapper: ({
    height: '220px',
    overflowY: 'scroll',
    overflowX: 'hidden',
    borderTop: `1px solid ${theme.colors.border.muted}`,
    borderBottom: `1px solid ${theme.colors.border.muted}`,
  } satisfies CSSObject),
  searchInput: ({
    padding: theme.spacing[3],
  } satisfies CSSObject),
};
