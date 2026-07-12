import {
  useState,
  useMemo,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { LocationIcon, SearchIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { CLASS_PREFIX } from '@/conf';
import { useCountriesQuery } from '@/services/country';
import type { FormErrors } from '@/types';
import { __, sprintf } from '@/wpi18n';

import { getSearchedCountries } from '@/pages/settings/utils';
import type { CountryWithGroup } from '@/pages/settings/tax-settings/helper';
import { groupEUCountries } from '@/pages/settings/tax-settings/helper';
import type { SelectedTaxRegionDraft, TaxRegion } from '@/pages/settings/tax-settings/utils';

type TaxRegionPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  regions: TaxRegion[];
  selectedCountries?: string[];
  setSelectedCountries?: Dispatch<SetStateAction<string[]>>;
  setSelectedRegion?: Dispatch<SetStateAction<SelectedTaxRegionDraft[]>>;
  selectedRegion?: SelectedTaxRegionDraft[];
  onAdd?: () => void;
  errors?: FormErrors;
};

type InitialPopupState = {
  countries: string[];
  regions: SelectedTaxRegionDraft[];
};

type CountryStateOption = {
  id: string | number;
  name: string;
  flag?: string;
};

const TaxRegionPopup = (props: TaxRegionPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    regions,
    selectedCountries = [],
    setSelectedCountries = () => {},
    setSelectedRegion = () => {},
    selectedRegion = [],
    onAdd = () => {},
  } = props;

  const [searchValue, setSearchValue] = useState('');
  const [initialObj, setInitialObj] = useState<InitialPopupState>({
    countries: [],
    regions: [],
  });
  const { data: countryList } = useCountriesQuery({ limit: -1 });
  const updatedCountryList = groupEUCountries(
    countryList as CountryWithGroup[] | null | undefined,
  );

  useEffect(() => {
    if (openPopup) {
      setInitialObj({
        countries: [...selectedCountries],
        regions: [...selectedRegion],
      });
    }
  }, [openPopup]);

  const filteredCountries = useMemo(() => {
    if (!updatedCountryList?.length) {
      return [];
    }

    const searched = searchValue?.trim()
      ? getSearchedCountries(searchValue, updatedCountryList)
      : updatedCountryList;

    return searched.filter(
      (country) => !regions.some((r) => r.code === country.code),
    );
  }, [searchValue, updatedCountryList, regions]);

  const handleSelectCountries = (country: CountryWithGroup) => {
    setSelectedCountries((prev = []) => {
      const isSelected = prev.includes(country.code);
      if (isSelected) {
        return prev.filter((c) => c !== country.code);
      }
      return [...prev, country.code];
    });

    setSelectedRegion((prev = []) => {
      const exists = prev.find((r) => r.country === country.name);

      if (exists) {
        return prev.filter((r) => r.country !== country.name);
      }
      const states = (country.states || []) as CountryStateOption[];
      return [
        ...prev,
        {
          id: country.code,
          country: country.name,
          states: states.map((s) => ({
            id: s.id,
            title: String(s.name),
            flag: s.flag || '',
          })),
          hasDeselectedState: false,
          flag: country.flag || '',
        },
      ];
    });
  };

  const handleSelectStates = (
    stateId: string | number,
    countryCode: string,
    allStates: CountryStateOption[] = [],
    flag?: string,
  ) => {
    setSelectedRegion((prev = []) => {
      const countryIndex = prev.findIndex((item) => item.id === countryCode);
      if (countryIndex === -1) {
        return prev;
      }
      const countryItem = prev[countryIndex];
      const stateExists = countryItem.states.some((s) => s.id === stateId);

      let updatedStates: SelectedTaxRegionDraft['states'];
      if (stateExists) {
        updatedStates = countryItem.states.filter((s) => s.id !== stateId);
      } else {
        updatedStates = [
          ...countryItem.states,
          {
            id: stateId,
            title: String(
              allStates.find((s) => s.id === stateId)?.name || stateId,
            ),
            flag: flag || '',
          },
        ];
      }

      if (updatedStates.length === 0) {
        setSelectedCountries((prevCountries = []) =>
          prevCountries.filter((c) => c !== countryCode),
        );
        return prev.filter((_, i) => i !== countryIndex);
      }
      const hasDeselectedState = updatedStates.length !== allStates.length;
      return prev.map((item, index) =>
        index === countryIndex
          ? { ...item, states: updatedStates, hasDeselectedState }
          : item,
      );
    });
  };
  const handleSearchRegion = (value: string) => {
    setSearchValue(value);
  };

  const handleClose = () => {
    setSelectedCountries(initialObj?.countries);
    setSelectedRegion(initialObj?.regions);
    setOpenPopup(false);
  };

  const buttonState = selectedCountries?.length >= 1;

  return (
    <>
      <Popover isOpen={openPopup}>
        <PopoverHeader
          borderBottom
          leftIcon={<LocationIcon />}
          onClose={() => setOpenPopup(false)}
        >
          {__('Add tax region', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            rowGap: 'var(--decom-spacing-3)',
          }}
        >
          <Input
            type="search"
            leftIcon={<SearchIcon />}
            label={__('Select countries', 'kirki-ecommerce')}
            placeholder="Cities"
            onChange={(value: string | number) =>
              handleSearchRegion(String(value))
            }
          />

          <Card
            type={'table'}
            style={{ borderRadius: 'var(--decom-radius-rounded-md)' }}
          >
            <div
              style={{
                height: '350px',
                overflowX: 'hidden',
                overflowY: 'scroll',
              }}
            >
              <Flex className={`${CLASS_PREFIX}-popover-heading-wrapper-dark`}>
                {__('Name', 'kirki-ecommerce')}
              </Flex>

              {filteredCountries?.length > 0 &&
                filteredCountries?.map((country, index) => {
                  const regionInfo = selectedRegion.find(
                    (region) => region?.country === country.code,
                  );
                  const countryStates = (country.states ||
                    []) as CountryStateOption[];
                  return (
                    <div
                      key={index}
                      className={`${CLASS_PREFIX}-checkbox-item`}
                    >
                      <Checkbox
                        value={selectedCountries?.includes(country?.code)}
                        isPartialChecked={regionInfo?.hasDeselectedState}
                        label={sprintf(__('%s', 'kirki-ecommerce'), country.name)}
                        onChange={() =>
                          handleSelectCountries(country as CountryWithGroup)
                        }
                        leftIcon={country?.flag}
                      />
                      {selectedCountries?.includes(country.code) &&
                      countryStates.length > 0 ? (
                        <div
                          style={{ padding: 'var(--decom-radius-rounded-xl)' }}
                        >
                          {countryStates.map((state, stateIndex) => {
                            return (
                              <div
                                key={stateIndex}
                                className={`${CLASS_PREFIX}-checkbox-item`}
                              >
                                <Checkbox
                                  value={selectedRegion
                                    ?.find((r) => r.id === country.code)
                                    ?.states.some((s) => s.id === state?.id)}
                                  label={sprintf(
                                    __('%s', 'kirki-ecommerce'),
                                    state.name,
                                  )}
                                  onChange={() =>
                                    handleSelectStates(
                                      state.id,
                                      country.code,
                                      countryStates,
                                      state?.flag,
                                    )
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
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
            onClick={handleClose}
          />
          <Button
            type="primary"
            text={__('Done', 'kirki-ecommerce')}
            size="small"
            onClick={onAdd}
            state={buttonState ? '' : 'disabled'}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

TaxRegionPopup.displayName = 'TaxRegionPopup';

export default TaxRegionPopup;
