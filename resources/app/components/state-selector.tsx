import Combobox from '@/components/ui/combobox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { LabelFieldProps } from '@/types/components/common';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type StateSelectorProps = LabelFieldProps & {
  country?: string | null;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const StateSelector = ({
  label,
  helpText,
  country,
  value,
  onChange,
  error,
  disabled,
}: StateSelectorProps) => {
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });

  const states = countries.find((item) => item.code === country)?.states ?? [];

  const options = states.map((state) => ({
    value: String(state.id),
    label: state.name,
  }));

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel>{label || __('State / Province', 'kirki-ecommerce')}</FieldLabel>
      <Combobox
        options={options}
        value={value}
        onChange={(next) => onChange(Array.isArray(next) ? (next[0] ?? '') : next)}
        error={Boolean(error)}
        disabled={!isDefined(country) || disabled}
        placeholder={
          isDefined(country)
            ? __('Select state', 'kirki-ecommerce')
            : __('Select a country first', 'kirki-ecommerce')
        }
        emptyText={__('No states found for this country.', 'kirki-ecommerce')}
        listCss={styles.wrapper}
        searchInputCss={styles.searchInput}
      />
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
};

StateSelector.displayName = 'StateSelector';

export default StateSelector;

const styles = defineStyles({
  wrapper: {
    height: '220px',
    overflowY: 'scroll',
    overflowX: 'hidden',
    borderTop: `1px solid ${theme.colors.border.muted}`,
    borderBottom: `1px solid ${theme.colors.border.muted}`,
  },
  searchInput: {
    padding: theme.spacing[1],
  },
});
