import { useMemo } from 'react';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCustomerLocationsQuery } from '@/features/customers/services/customer';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type FilterObject = {
  country?: string;
  city?: string;
};

type LocationFilterProps = {
  filterObject: FilterObject;
  onCountryChange?: (val: string) => void;
  onCityChange?: (val: string) => void;
};

const ALL = 'all';

const LocationFilter = ({
  filterObject,
  onCountryChange = noop,
  onCityChange = noop,
}: LocationFilterProps) => {
  const selectedCountry = filterObject.country ?? ALL;
  const { data: locations } = useCustomerLocationsQuery(
    selectedCountry === ALL ? undefined : selectedCountry,
  );

  const countryOptions = useMemo(
    () => [ALL, ...(locations?.countries ?? [])],
    [locations?.countries],
  );

  const cityOptions = useMemo(() => [ALL, ...(locations?.cities ?? [])], [locations?.cities]);

  const handleCountryChange = (value: string) => {
    onCountryChange(value);

    const cityStillOffered = value === ALL ? false : cityOptions.includes(filterObject.city ?? ALL);

    if (!cityStillOffered) {
      onCityChange(ALL);
    }
  };

  return (
    <>
      <Flex direction="column" gap={2}>
        <Label>{__('Country', 'kirki-ecommerce')}</Label>
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
          </SelectTrigger>
          <SelectContent>
            {countryOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === ALL ? __('All', 'kirki-ecommerce') : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Flex>

      <Flex direction="column" gap={2}>
        <Label>{__('City', 'kirki-ecommerce')}</Label>
        <Select
          value={filterObject.city ?? ALL}
          onValueChange={(val) => onCityChange(val)}
          disabled={selectedCountry === ALL}
        >
          <SelectTrigger>
            <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
          </SelectTrigger>
          <SelectContent>
            {cityOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === ALL ? __('All', 'kirki-ecommerce') : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Flex>
    </>
  );
};

LocationFilter.displayName = 'LocationFilter';

export default LocationFilter;
