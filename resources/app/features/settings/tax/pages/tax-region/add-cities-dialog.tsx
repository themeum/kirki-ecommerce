import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import { getSearchedValue } from '@/features/settings/lib/utils';
import type { TaxRegionState } from '@/features/settings/tax/lib/utils';
import {
  type AddCitiesPopupFormInput,
  AddCitiesPopupFormSchema,
} from '@/features/settings/tax/schemas/forms/add-cities-popup-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type AddCitiesPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  countryName?: string;
  cityList?: TaxRegionState[];
  /**
   * States that already have a rate row. They stay listed — shown checked and
   * disabled under an "Already in use" tooltip — rather than being filtered
   * out, so the list reads the same on every visit.
   */
  disabledIds?: Set<string>;
  selectedCities: TaxRegionState[];
  setSelectedCities: Dispatch<SetStateAction<TaxRegionState[]>>;
  onAdd: () => void;
};

const AddCitiesPopup = (props: AddCitiesPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    countryName,
    cityList,
    disabledIds,
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

  const isDisabled = (city: TaxRegionState) => Boolean(disabledIds?.has(String(city.id)));

  /**
   * Select-all and its partial state count only the states still available —
   * the disabled ones can never be part of the selection.
   */
  const selectableCities = useMemo(
    () => (cityList ?? []).filter((city) => !disabledIds?.has(String(city.id))),
    [cityList, disabledIds],
  );

  const selectAll =
    formSelectedCities.length > 0 && formSelectedCities.length === selectableCities.length;

  const isPartialChecked =
    formSelectedCities.length > 0 && formSelectedCities.length < selectableCities.length;

  const handleToggleCity = (city: TaxRegionState) => {
    if (isDisabled(city)) {
      return;
    }

    const current = form.getValues('selectedCities') as TaxRegionState[];
    const exists = current.some((c) => String(c.id) === String(city.id));
    const next = exists
      ? current.filter((c) => String(c.id) !== String(city.id))
      : [...current, city];
    syncSelection(next);
  };

  const filteredCities = getSearchedValue(searchValue, cityList ?? []);

  const handleSelectAll = () => {
    if (isPartialChecked) {
      syncSelection([]);
      return;
    }

    syncSelection(selectAll ? [] : [...selectableCities]);
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
              <Label htmlFor="add-cities-search">{__('Cities', 'kirki-ecommerce')}</Label>
              <Input
                id="add-cities-search"
                type="search"
                placeholder="Search"
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Flex>

            <Card cssOverride={cardStyles.tableCardRounded}>
              <CardContent cssOverride={mergeCss(cardStyles.tableContent, styles.cardContent)}>
                <Flex gap={2} align="center">
                  <Checkbox
                    id="add-cities-select-all"
                    checked={isPartialChecked ? 'indeterminate' : selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="add-cities-select-all">{countryName}</Label>
                </Flex>

                {filteredCities?.length > 0 ? (
                  filteredCities.map((city) => {
                    const disabled = isDisabled(city);
                    const cityRowContent = (
                      <>
                        <Checkbox
                          id={`add-cities-city-${city.id}`}
                          disabled={disabled}
                          checked={
                            disabled ||
                            formSelectedCities.some((item) => String(item.id) === String(city.id))
                          }
                          onCheckedChange={() => handleToggleCity(city)}
                        />
                        <Label htmlFor={`add-cities-city-${city.id}`}>
                          {city.name ?? city.title}
                        </Label>
                      </>
                    );

                    return (
                      <div key={String(city.id)} css={scoped(styles.checkboxItemIndented)}>
                        {disabled ? (
                          <Tooltip
                            tip={__('Already in use', 'kirki-ecommerce')}
                            position="right"
                            cssOverride={styles.disabledRowTrigger}
                          >
                            <Flex gap={2} align="center">
                              {cityRowContent}
                            </Flex>
                          </Tooltip>
                        ) : (
                          <Flex gap={2} align="center">
                            {cityRowContent}
                          </Flex>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <Card cssOverride={styles.emptyCitiesCard}>
                    <CardContent>
                      <Flex direction="column" gap={2} align="center">
                        <Text weight="medium">{__('No cities available')}</Text>
                      </Flex>
                    </CardContent>
                  </Card>
                )}
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
  cardContent: {
    height: '350px',
    overflowX: 'hidden',
    overflowY: 'scroll',
    paddingLeft: theme.spacing[3],
    paddingTop: theme.spacing[3],
  },
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
  disabledRowTrigger: {
    display: 'flex',
    width: '100%',
    cursor: 'not-allowed',
  },
});
