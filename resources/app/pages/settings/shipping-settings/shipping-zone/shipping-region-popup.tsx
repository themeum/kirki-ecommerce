import { useState, type Dispatch, type SetStateAction } from 'react';

import Input from '@/molecules/input';
import Checkbox from '@/molecules/checkbox';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { SearchIcon, LocationIcon } from '@/icons';
import { CLASS_PREFIX } from '@/conf';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import type {
  CountryWithStates,
  ShippingRegion,
} from '../utils';

type ShippingRegionPopupProps = {
  filteredCountries: CountryWithStates[];
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  selectedCountries?: string[];
  setSelectedCountries?: Dispatch<SetStateAction<string[]>>;
  setSelectedRegion?: Dispatch<SetStateAction<ShippingRegion[]>>;
  selectedRegion?: ShippingRegion[];
  setSearchValue?: ((value: string) => void) | null;
  shippingZoneTitle?: string;
  setShippingZoneTitle?: (value: string) => void;
  from?: string;
  onAdd?: () => void;
  errors?: FormErrors;
};

export const ShippingRegionPopup = ({
  filteredCountries,
  openPopup,
  setOpenPopup,
  selectedCountries = [],
  setSelectedCountries = () => {},
  setSelectedRegion = () => {},
  selectedRegion = [],
  setSearchValue = null,
  shippingZoneTitle,
  setShippingZoneTitle,
  from = '',
  onAdd = () => {},
  errors,
}: ShippingRegionPopupProps) => {
  const [initialDataObj] = useState({
    countries: selectedCountries || [],
    regions: selectedRegion || [],
  });

  const handleSelectCountries = (country: CountryWithStates) => {
    setSelectedCountries((prev = []) =>
      prev.includes(country.code)
        ? prev.filter((c) => c !== country.code)
        : [...prev, country.code],
    );
    setSelectedRegion((prev = []) => {
      const exists = prev.find((r) => r.country === country.code);
      if (exists) {
        return prev.filter((r) => r.country !== country.code);
      }
      return [
        ...prev,
        {
          country: country.code,
          states: (country.states ?? []).map((s) => s.id),
          hasDeselectedState: false,
          flag: country?.flag,
        },
      ];
    });
  };

  const handleSelectStates = (
    stateId: string | number,
    countryCode: string,
    allStates: Array<{ id: string | number; name: string }> = [],
  ) => {
    setSelectedRegion((prev = []) => {
      const countryIndex = prev.findIndex(
        (item) => item.country === countryCode,
      );

      if (countryIndex === -1) {
        return prev;
      }

      const countryItem = prev[countryIndex];
      const stateExists = countryItem.states.includes(stateId);

      const updatedStates = stateExists
        ? countryItem.states.filter((id) => id !== stateId)
        : [...countryItem.states, stateId];

      if (updatedStates.length === 0) {
        setSelectedCountries((prevCountries = []) =>
          prevCountries.filter((c) => c !== countryCode),
        );
        return prev.filter((_, i) => i !== countryIndex);
      }

      const hasDeselectedState = updatedStates.length !== allStates.length;

      return prev.map((item, index) =>
        index === countryIndex
          ? {
              ...item,
              states: updatedStates,
              hasDeselectedState,
            }
          : item,
      );
    });
  };

  const handleCancelButton = () => {
    setSelectedCountries([...initialDataObj?.countries]);
    setSelectedRegion([...initialDataObj?.regions]);
    setOpenPopup(false);
  };

  const handleSearchRegion = (value: string) => {
    setSearchValue?.(value);
  };
  const buttonState =
    shippingZoneTitle === '' || selectedCountries?.length === 0;

  return (
    <>
      <Popover isOpen={openPopup}>
        <PopoverHeader
          borderBottom
          leftIcon={<LocationIcon />}
          onClose={() => setOpenPopup(false)}
        >
          {__('Add shipping region', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding: 'var(--decom-spacing-2) var(--decom-spacing-5)',
            rowGap: 'var( --decom-spacing-2)',
          }}
        >
          {from === 'add' && (
            <Input
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('Zone 2- South Asia', 'kirki-ecommerce')}
              onChange={(value) => setShippingZoneTitle?.(String(value))}
              error={(errors?.title as string) || ''}
            />
          )}

          <Input
            type="search"
            leftIcon={<SearchIcon />}
            label={__('Select countries', 'kirki-ecommerce')}
            placeholder={__('Search country or state', 'kirki-ecommerce')}
            onChange={(value) => handleSearchRegion(String(value))}
            error={(errors?.regions as string) || ''}
          />

          <Card
            type={'table'}
            style={{ borderRadius: 'var(--decom-radius-rounded-md)' }}
          >
            <div
              style={{
                height: '432px',
                overflowX: 'hidden',
                overflowY: 'scroll',
              }}
            >
              <Flex className={`${CLASS_PREFIX}-popover-heading-wrapper-dark`}>
                {__('Name', 'kirki-ecommerce')}
              </Flex>

              {filteredCountries?.length > 0 &&
                filteredCountries.map((country, index) => {
                  const regionInfo = selectedRegion.find(
                    (r) => r.country === country.code,
                  );
                  return (
                    <div key={index}>
                      <div className={`${CLASS_PREFIX}-checkbox-item`}>
                        <Checkbox
                          value={selectedCountries?.includes(country?.code)}
                          isPartialChecked={regionInfo?.hasDeselectedState}
                          label={country.name}
                          onChange={() => handleSelectCountries(country)}
                          leftIcon={country?.flag}
                        />
                      </div>
                      {selectedCountries.includes(country.code) &&
                      (country?.states?.length ?? 0) > 0 ? (
                        <div
                          style={{
                            padding:
                              'var(--decom-spacing-0) var(--decom-spacing-3)',
                          }}
                        >
                          {(country?.states ?? []).map((state, stateIndex) => (
                            <div
                              key={stateIndex}
                              className={`${CLASS_PREFIX}-checkbox-item`}
                            >
                              <Checkbox
                                value={selectedRegion
                                  ?.find((r) => r.country === country.code)
                                  ?.states.includes(state.id)}
                                label={state.name}
                                onChange={() =>
                                  handleSelectStates(
                                    state.id,
                                    country.code,
                                    country.states,
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        ''
                      )}
                    </div>
                  );
                })}
            </div>
          </Card>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__('Cancel', 'kirki-ecommerce')}
            size="small"
            onClick={() => handleCancelButton()}
          />
          <Button
            type="primary"
            text={__('Done', 'kirki-ecommerce')}
            size="small"
            onClick={onAdd}
            state={buttonState ? 'disabled' : ''}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};
