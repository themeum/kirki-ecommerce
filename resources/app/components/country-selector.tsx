import { Select } from '@/molecules/select';
import useGetListAPI from '@/hooks/useGetListAPI';
import { useAppSelector } from '@/store/hooks';
import { getCountriesAPI } from '@/store/countriesSlice';
import type { LabelFieldProps } from '@/types';
import { __ } from '@/wpi18n';

type CountrySelectorProps = LabelFieldProps & {
  value?: string | number | Array<string | number>;
  onChange: (value: string | number | Array<string | number>) => void;
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
  useGetListAPI({
    reducerName: 'countries',
    apiCallBack: getCountriesAPI,
    limit: -1,
  });
  const countries = useAppSelector((state) => state.countries?.data) || [];
  const optionsArray = countries.map((country) => ({
    value: country.code,
    title: country.name,
    leftIcon: country.flag,
  }));
  return (
    <Select
      label={label || __('Country / Region', 'kirki-ecommerce')}
      value={value}
      optionsArray={optionsArray}
      defaultValue={value}
      onChange={(nextValue: string | number | Array<string | number>) => onChange(nextValue)}
      error={error}
      helpText={helpText}
      multiple={multiple}
    />
  );
};

export default CountrySelector;
