import { useState, useMemo, type Dispatch, type SetStateAction } from 'react';

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
import Text from '@/molecules/text';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

import { getSearchedValue } from '../../utils';
import type { TaxRate, TaxRegionState } from '../utils';

type AddCitiesPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  taxRates: TaxRate[];
  countryName?: string;
  cityList?: TaxRegionState[];
  selectedCities: TaxRegionState[];
  setSelectedCities: Dispatch<SetStateAction<TaxRegionState[]>>;
  onAdd: () => void;
};

const AddCitiesPopup = (props: AddCitiesPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    taxRates,
    countryName,
    cityList,
    selectedCities,
    setSelectedCities,
    onAdd,
  } = props;

  const [searchValue, setSearchValue] = useState('');

  const allCityIds = useMemo(
    () => cityList?.map((city) => city.id) || [],
    [cityList],
  );

  const selectAll =
    selectedCities.length > 0 && selectedCities.length === allCityIds.length;

  const isPartialChecked =
    selectedCities.length > 0 && selectedCities.length < allCityIds.length;

  const handleToggleCity = (city: TaxRegionState) => {
    setSelectedCities((prev = []) => {
      const exists = prev.some((c) => c.id === city.id);

      if (exists) {
        return prev.filter((c) => c.id !== city.id);
      }

      return [...prev, city];
    });
  };

  const filteredCities = getSearchedValue(
    searchValue,
    (cityList || []).filter(
      (city) => !taxRates.some((tax) => tax.state === city.title),
    ),
  );

  const handleSelectAll = () => {
    if (isPartialChecked) {
      setSelectedCities([]);
    } else {
      setSelectedCities(selectAll ? [] : [...(cityList || [])]);
    }
  };

  const buttonState = selectedCities?.length <= 0;

  return (
    <div>
      <Popover isOpen={openPopup}>
        <PopoverHeader
          borderBottom
          leftIcon={<LocationIcon />}
          onClose={() => setOpenPopup(false)}
        >
          {__('Add cities', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody>
          <Input
            type="search"
            leftIcon={<SearchIcon />}
            label={__('Cities', 'kirki-ecommerce')}
            placeholder="Search"
            onChange={(value: string | number) => setSearchValue(String(value))}
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
                <Checkbox
                  value={isPartialChecked || selectAll}
                  isPartialChecked={isPartialChecked}
                  label={countryName}
                  onChange={handleSelectAll}
                />
              </Flex>

              {filteredCities?.length > 0 ? (
                filteredCities.map((city, index) => {
                  return (
                    <div
                      key={index}
                      className={`${CLASS_PREFIX}-checkbox-item`}
                      style={{
                        padding:
                          'var(--decom-spacing-2) var(--decom-spacing-5)',
                        width: 'auto',
                      }}
                    >
                      <Checkbox
                        value={selectedCities.some(
                          (item) => item.id === city.id,
                        )}
                        label={city.title}
                        onChange={() => handleToggleCity(city)}
                      />
                    </div>
                  );
                })
              ) : (
                <Card style={{ padding: '36px 0' }}>
                  <Flex
                    direction="column"
                    gap={8}
                    style={{ alignItems: 'center' }}
                  >
                    <Text header={__('No cities available')} type="secondary" />
                  </Flex>
                </Card>
              )}
            </div>
          </Card>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__('Cancel', 'kirki-ecommerce')}
            size="small"
            onClick={() => {
              setSelectedCities(selectedCities);
              setOpenPopup(false);
            }}
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
    </div>
  );
};

AddCitiesPopup.displayName = 'AddCitiesPopup';

export default AddCitiesPopup;
