import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
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
import {
  AddCitiesPopupFormSchema,
  type AddCitiesPopupFormValues,
} from '@/schemas/forms/add-cities-popup-form';
import { __ } from '@/wpi18n';

import { getSearchedValue } from '@/pages/settings/utils';
import type { TaxRate, TaxRegionState } from '@/pages/settings/tax-settings/utils';

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

  const form = useForm<AddCitiesPopupFormValues>({
    resolver: zodResolver(AddCitiesPopupFormSchema),
    defaultValues: {
      selectedCities,
    },
  });

  const formSelectedCities = form.watch('selectedCities') as TaxRegionState[];

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    form.reset({ selectedCities });
    setSearchValue('');
  }, [openPopup]);

  const syncSelection = (next: TaxRegionState[]) => {
    form.setValue('selectedCities', next, { shouldDirty: true });
    setSelectedCities(next);
  };

  const allCityIds = useMemo(
    () => cityList?.map((city) => city.id) || [],
    [cityList],
  );

  const selectAll =
    formSelectedCities.length > 0 &&
    formSelectedCities.length === allCityIds.length;

  const isPartialChecked =
    formSelectedCities.length > 0 &&
    formSelectedCities.length < allCityIds.length;

  const handleToggleCity = (city: TaxRegionState) => {
    const current = form.getValues('selectedCities') as TaxRegionState[];
    const exists = current.some((c) => c.id === city.id);
    const next = exists
      ? current.filter((c) => c.id !== city.id)
      : [...current, city];
    syncSelection(next);
  };

  const filteredCities = getSearchedValue(
    searchValue,
    (cityList || []).filter(
      (city) => !taxRates.some((tax) => tax.state === city.title),
    ),
  );

  const handleSelectAll = () => {
    if (isPartialChecked) {
      syncSelection([]);
      return;
    }

    syncSelection(selectAll ? [] : [...(cityList || [])]);
  };

  const buttonState = formSelectedCities?.length <= 0;

  const handleSubmit = () => {
    onAdd();
  };

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
        <Form {...form}>
          <PopoverBody>
            <Input
              type="search"
              leftIcon={<SearchIcon />}
              label={__('Cities', 'kirki-ecommerce')}
              placeholder="Search"
              onChange={(value: string | number) =>
                setSearchValue(String(value))
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
                          value={formSelectedCities.some(
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
                      <Text
                        header={__('No cities available')}
                        type="secondary"
                      />
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
              onClick={form.handleSubmit(handleSubmit)}
              state={buttonState ? 'disabled' : ''}
            />
          </PopoverFooter>
        </Form>
      </Popover>
    </div>
  );
};

AddCitiesPopup.displayName = 'AddCitiesPopup';

export default AddCitiesPopup;
