import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

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
import { getSearchedValue } from '@/features/settings/lib/utils';
import type { TaxRegionState } from '@/features/settings/tax/shared/lib/utils';
import {
  type AddStatePopupFormInput,
  AddStatePopupFormSchema,
} from '@/features/settings/tax/shared/schemas/forms/add-state-popup-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

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

  const form = useForm<AddStatePopupFormInput>({
    resolver: zodResolver(AddStatePopupFormSchema),
    defaultValues: {
      selectedCountries,
    },
  });

  const formSelected = useWatch({ control: form.control, name: 'selectedCountries' });

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    form.reset({ selectedCountries });
    setSearchValue('');
  }, [openPopup, form, selectedCountries]);

  const syncSelection = (next: DestinationSelection[]) => {
    form.setValue('selectedCountries', next, { shouldDirty: true });
    setSelectedCountries(next);
  };

  const destinationIdOf = (item: TaxRegionState): DestinationSelection =>
    item.code ?? String(item.id);

  const allCountryIds = countryList.map(destinationIdOf);
  const selectAll = formSelected.length > 0 && formSelected.length === allCountryIds.length;

  const handleToggleCountry = (countryId: DestinationSelection) => {
    const current = form.getValues('selectedCountries');
    const next = current.includes(countryId)
      ? current.filter((id) => id !== countryId)
      : [...current, countryId];
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
          <DialogTitle>{__('Select destination', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={2}>
              <Label htmlFor="add-state-search">{__('Regions', 'kirki-ecommerce')}</Label>
              <Input
                id="add-state-search"
                type="search"
                placeholder={__('Search', 'kirki-ecommerce')}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Flex>

            <Card cssOverride={cardStyles.lightCard}>
              <CardContent cssOverride={styles.cardContent}>
                <Flex gap={2} align="center">
                  <Checkbox
                    id="add-state-select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="add-state-select-all">
                    {countryName || __('EU', 'kirki-ecommerce')}
                  </Label>
                </Flex>

                {filteredCountries?.map((country, index) => {
                  const destinationId = destinationIdOf(country);

                  return (
                    <div key={destinationId} css={scoped(styles.checkboxItemIndented)}>
                      <Flex gap={2} align="center">
                        <Checkbox
                          id={`add-state-country-${index}`}
                          checked={formSelected?.includes(destinationId)}
                          onCheckedChange={() => handleToggleCountry(destinationId)}
                        />
                        <Label htmlFor={`add-state-country-${index}`}>
                          {country?.flag}
                          {country?.name ?? country?.title ?? destinationId}
                        </Label>
                      </Flex>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCountries(selectedCountries);
                setOpenPopup(false);
              }}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={form.handleSubmit(handleSubmit)}>
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

AddStatePopup.displayName = 'AddStatePopup';

const styles = defineStyles({
  cardContent: {
    height: '350px',
    overflowX: 'hidden',
    overflowY: 'scroll',
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
});
