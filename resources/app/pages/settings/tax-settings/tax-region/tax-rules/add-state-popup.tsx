import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
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
import { CLASS_PREFIX } from '@/conf';
import {
  AddStatePopupFormSchema,
  type AddStatePopupFormValues,
} from '@/schemas/forms/add-state-popup-form';
import { __, sprintf } from '@/wpi18n';

import { getSearchedValue } from '@/pages/settings/utils';
import type { TaxRegionState } from '@/pages/settings/tax-settings/utils';

type DestinationSelection = string | number;

type AddStatePopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  countryName?: string;
  countryList: TaxRegionState[];
  selectedCountries: DestinationSelection[];
  setSelectedCountries: Dispatch<SetStateAction<DestinationSelection[]>>;
  onAdd: () => void;
};

export const AddStatePopup = (props: AddStatePopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    countryName = '',
    countryList,
    selectedCountries,
    setSelectedCountries,
    onAdd,
  } = props;

  const [searchValue, setSearchValue] = useState('');

  const form = useForm<AddStatePopupFormValues>({
    resolver: zodResolver(AddStatePopupFormSchema),
    defaultValues: {
      selectedCountries,
    },
  });

  const formSelected = form.watch('selectedCountries');

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    form.reset({ selectedCountries });
    setSearchValue('');
  }, [openPopup]);

  const syncSelection = (next: DestinationSelection[]) => {
    form.setValue('selectedCountries', next, { shouldDirty: true });
    setSelectedCountries(next);
  };

  const allCountryIds = countryList.map((country) => country?.id);
  const selectAll =
    formSelected.length > 0 && formSelected.length === allCountryIds.length;

  const handleToggleCountry = (countryId: DestinationSelection | undefined) => {
    const current = form.getValues('selectedCountries');
    const next = current.includes(countryId as DestinationSelection)
      ? current.filter((id) => id !== countryId)
      : [...current, countryId as DestinationSelection];
    syncSelection(next);
  };

  const filteredCountries = getSearchedValue(searchValue, countryList);

  const handleSelectAll = () => {
    syncSelection(selectAll ? [] : allCountryIds);
  };

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
          {__('Select destination', 'kirki-ecommerce')}
        </PopoverHeader>
        <Form {...form}>
          <PopoverBody>
            <Input
              type="search"
              leftIcon={<SearchIcon />}
              label={__('Regions', 'kirki-ecommerce')}
              placeholder={__('Search', 'kirki-ecommerce')}
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
                    value={selectAll}
                    label={countryName || __('EU', 'kirki-ecommerce')}
                    onChange={handleSelectAll}
                  />
                </Flex>

                {filteredCountries?.map((country, index) => {
                  return (
                    <div
                      key={index}
                      style={{
                        padding:
                          'var(--decom-spacing-2) var(--decom-spacing-5)',
                        width: 'auto',
                      }}
                      className={`${CLASS_PREFIX}-checkbox-item`}
                    >
                      <Checkbox
                        value={formSelected?.includes(
                          country?.title as DestinationSelection,
                        )}
                        label={sprintf(
                          __('%s', 'kirki-ecommerce'),
                          country?.title ?? '',
                        )}
                        onChange={() => handleToggleCountry(country?.title)}
                        leftIcon={country?.flag}
                      />
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
              onClick={() => {
                setSelectedCountries(selectedCountries);
                setOpenPopup(false);
              }}
            />
            <Button
              type="primary"
              text={__('Done', 'kirki-ecommerce')}
              size="small"
              onClick={form.handleSubmit(handleSubmit)}
            />
          </PopoverFooter>
        </Form>
      </Popover>
    </div>
  );
};

AddStatePopup.displayName = 'AddStatePopup';
