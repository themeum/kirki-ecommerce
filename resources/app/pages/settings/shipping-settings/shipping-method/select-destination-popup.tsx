import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

import Checkbox from '@/molecules/checkbox';
import Button from '@/molecules/button';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { Select } from '@/molecules/select';
import { CLASS_PREFIX } from '@/conf';
import { LocationIcon, SearchIcon } from '@/icons';
import { useGetListAPI } from '@/hooks';
import { getCountriesAPI } from '@/store/countriesSlice';
import { useAppSelector } from '@/store/hooks';
import { __ } from '@/wpi18n';

import type {
  CountryWithStates,
  ShippingRegion,
  ShippingRule,
} from '../utils';

type DestinationConditionValue = {
  country: string;
  states: Array<string | number>;
};

type SelectDestinationPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  selectedRegion: ShippingRegion[];
  selectedCountry: string | null;
  setSelectedCountry: Dispatch<SetStateAction<string | null>>;
  setSelectedRegion: Dispatch<SetStateAction<ShippingRegion[]>>;
  selectedConditionValue: DestinationConditionValue | unknown;
  setSelectedConditionValue: Dispatch<SetStateAction<unknown>>;
  setRulesObj: Dispatch<SetStateAction<ShippingRule[]>>;
  ruleIndex: number;
};

export const SelectDestinationPopup = ({
  openPopup,
  setOpenPopup,
  selectedRegion,
  selectedCountry,
  setSelectedCountry,
  setSelectedRegion,
  selectedConditionValue,
  setSelectedConditionValue,
  setRulesObj,
  ruleIndex,
}: SelectDestinationPopupProps) => {
  const countryList = useAppSelector((state) => state.countries?.data) as
    | CountryWithStates[]
    | null;
  const [stateList, setStateList] = useState<
    Array<{ id: string | number; name: string }>
  >([]);
  const [selectedStates, setSelectedStates] = useState<Array<string | number>>(
    [],
  );

  useGetListAPI({
    reducerName: 'countries',
    apiCallBack: getCountriesAPI,
    limit: -1,
  });

  const countryOptions = countryList
    ?.filter((country) =>
      selectedRegion?.some((region) => region.country === country.code),
    )
    .map((country) => ({
      title: country.name,
      value: country.code,
      leftIcon: country.flag,
    }));

  useEffect(() => {
    if (!selectedCountry) {
      return;
    }

    const country = countryList?.find(
      (country) =>
        country.code.toLowerCase() === selectedCountry.toLowerCase(),
    );

    setStateList(country?.states || []);
    const conditionValue = selectedConditionValue as
      | DestinationConditionValue
      | null;
    const statesFromCondition =
      conditionValue?.country === selectedCountry
        ? conditionValue.states
        : null;

    const regionForCountry = selectedRegion?.find(
      (r) => r.country.toLowerCase() === selectedCountry.toLowerCase(),
    );

    setSelectedStates(statesFromCondition ?? regionForCountry?.states ?? []);
  }, [selectedCountry, countryList]);

  const handleSelectState = (stateId: string | number) => {
    setSelectedStates((prev) =>
      prev.includes(stateId)
        ? prev.filter((id) => id !== stateId)
        : [...prev, stateId],
    );
  };

  const updateRegionList = () => {
    setSelectedRegion((prev) =>
      prev.map((r) =>
        r.country === selectedCountry ? { ...r, states: selectedStates } : r,
      ),
    );
    if (ruleIndex !== -1) {
      setRulesObj((prev) =>
        prev.map((rule, idx) => {
          if (idx !== ruleIndex) {
            return rule;
          }

          const condition = rule.conditions?.[0];
          if (!condition || condition.type !== 'destination_region') {
            return rule;
          }

          const conditionValue = condition.value as DestinationConditionValue;
          const isSameCountry = conditionValue?.country === selectedCountry;

          return {
            ...rule,
            conditions: [
              {
                ...condition,
                value: isSameCountry
                  ? {
                      ...conditionValue,
                      states: selectedStates,
                    }
                  : {
                      country: selectedCountry,
                      states: selectedStates,
                    },
              },
            ],
          };
        }),
      );
    } else {
      setSelectedConditionValue({
        country: selectedCountry,
        states: selectedStates || [],
      });
    }
    setOpenPopup(false);
  };

  const handleSelectCountry = (value: string) => {
    setSelectedCountry(value);
  };

  return (
    <>
      <Popover isOpen={openPopup}>
        <PopoverHeader
          borderBottom
          onClose={() => setOpenPopup(false)}
          leftIcon={<LocationIcon />}
        >
          {__('Select destination', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding: 'var(--decom-spacing-4) var(--decom-spacing-5)',
          }}
        >
          <Select
            label={__('Select country', 'kirki-ecommerce')}
            optionsArray={countryOptions}
            value={selectedCountry ?? undefined}
            onChange={(value) => handleSelectCountry(String(value))}
          />

          <>
            <Input
              type="search"
              leftIcon={<SearchIcon />}
              label={__('Regions', 'kirki-ecommerce')}
              placeholder={__('Search region or state', 'kirki-ecommerce')}
            />

            <div
              style={{
                height: '350px',
                overflowX: 'hidden',
                overflowY: 'scroll',
              }}
            >
              {stateList?.map((state, index) => (
                <div key={index} className={`${CLASS_PREFIX}-checkbox-item`}>
                  <Checkbox
                    value={selectedStates.includes(state.id)}
                    label={state.name}
                    onChange={() => handleSelectState(state?.id)}
                  />
                </div>
              ))}
            </div>
          </>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__('Cancel', 'kirki-ecommerce')}
            onClick={() => {
              setOpenPopup(false);
            }}
          />
          <Button
            type="primary"
            text={__('Done', 'kirki-ecommerce')}
            onClick={() => updateRegionList()}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};
