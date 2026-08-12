import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Text from '@/components/ui/text';
import type { TaxRate, TaxRegionState } from '@/pages/settings/tax-settings/utils';
import { getSearchedValue } from '@/pages/settings/utils';
import { type AddCitiesPopupFormInput, AddCitiesPopupFormSchema } from '@/schemas/forms/add-cities-popup-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

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

  const form = useForm<AddCitiesPopupFormInput>({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds the form from the current selection only as the dialog opens; tracking selectedCities would reset the form while the user is picking cities
  }, [openPopup]);

  const syncSelection = (next: TaxRegionState[]) => {
    form.setValue('selectedCities', next, { shouldDirty: true });
    setSelectedCities(next);
  };

  const allCityIds = useMemo(
    () => cityList?.map((city) => city.id) ?? [],
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
    (cityList ?? []).filter(
      (city) => !taxRates.some((tax) => tax.state === city.title),
    ),
  );

  const handleSelectAll = () => {
    if (isPartialChecked) {
      syncSelection([]);
      return;
    }

    syncSelection(selectAll ? [] : [...(cityList ?? [])]);
  };

  const buttonState = formSelectedCities?.length <= 0;

  const handleSubmit = () => {
    onAdd();
  };

  return (
    <Dialog
      open={openPopup}
      onOpenChange={(next) => {
        if (!next) {
          setOpenPopup(false);
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{__('Add cities', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={2}>
              <Label htmlFor="add-cities-search">
                {__('Cities', 'kirki-ecommerce')}
              </Label>
              <Input
                id="add-cities-search"
                type="search"
                placeholder="Search"
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Flex>

            <Card cssOverride={cardStyles.tableCardRounded}>
              <CardContent cssOverride={cardStyles.tableContent}>
                <div
                  style={{
                    height: '350px',
                    overflowX: 'hidden',
                    overflowY: 'scroll',
                  }}
                >
                <Flex>
                  <Flex gap={2} align="center">
                    <Checkbox
                      id="add-cities-select-all"
                      checked={
                        isPartialChecked ? 'indeterminate' : selectAll
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="add-cities-select-all">
                      {countryName}
                    </Label>
                  </Flex>
                </Flex>

                {filteredCities?.length > 0 ? (
                  filteredCities.map((city, index) => {
                    return (
                      <div key={index} css={scoped(styles.checkboxItemIndented)}>
                        <Flex gap={2} align="center">
                          <Checkbox
                            id={`add-cities-city-${city.id}`}
                            checked={formSelectedCities.some(
                              (item) => item.id === city.id,
                            )}
                            onCheckedChange={() => handleToggleCity(city)}
                          />
                          <Label htmlFor={`add-cities-city-${city.id}`}>
                            {city.title}
                          </Label>
                        </Flex>
                      </div>
                    );
                  })
                ) : (
                  <Card cssOverride={styles.emptyCitiesCard}>
                    <CardContent>
                      <Flex
                        direction="column"
                        gap={2}
                        align="center">
                        <Text weight="medium">{__('No cities available')}</Text>
                      </Flex>
                    </CardContent>
                  </Card>
                )}
                </div>
              </CardContent>
            </Card>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCities(selectedCities);
                setOpenPopup(false);
              }}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={buttonState}
            >
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

AddCitiesPopup.displayName = 'AddCitiesPopup';

export default AddCitiesPopup;

const styles = defineStyles({
  checkboxItemIndented: {
    width: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[5]}`,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
      borderRadius: theme.radius.sm,
    },
  },
  emptyCitiesCard: {
    padding: `${theme.spacing[9]} 0`,
  },
});
