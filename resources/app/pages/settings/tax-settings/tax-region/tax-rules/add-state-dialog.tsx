import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import type { TaxRegionState } from '@/pages/settings/tax-settings/utils';
import { getSearchedValue } from '@/pages/settings/utils';
import { type AddStatePopupFormInput, AddStatePopupFormSchema } from '@/schemas/forms/add-state-popup-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

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

  const formSelected = form.watch('selectedCountries');

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    form.reset({ selectedCountries });
    setSearchValue('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds the form from the current selection only as the dialog opens; tracking selectedCountries would reset the form while the user is picking states
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
    const next = current.includes(countryId!)
      ? current.filter((id) => id !== countryId)
      : [...current, countryId!];
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
          <DialogTitle>
            {__('Select destination', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={2}>
              <Label htmlFor="add-state-search">
                {__('Regions', 'kirki-ecommerce')}
              </Label>
              <Input
                id="add-state-search"
                type="search"
                placeholder={__('Search', 'kirki-ecommerce')}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Flex>

            <Card cssOverride={cardStyles.lightCard}>
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
                      id="add-state-select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="add-state-select-all">
                      {countryName || __('EU', 'kirki-ecommerce')}
                    </Label>
                  </Flex>
                </Flex>

                {filteredCountries?.map((country, index) => {
                  return (
                    <div key={index} css={scoped(styles.checkboxItemIndented)}>
                      <Flex gap={2} align="center">
                        <Checkbox
                          id={`add-state-country-${index}`}
                          checked={formSelected?.includes(
                            country?.title as DestinationSelection,
                          )}
                          onCheckedChange={() =>
                            handleToggleCountry(country?.title)
                          }
                        />
                        <Label htmlFor={`add-state-country-${index}`}>
                          {country?.flag}
                          {sprintf(__('%s', 'kirki-ecommerce'), country?.title ?? '')}
                        </Label>
                      </Flex>
                    </div>
                  );
                })}
              </div>
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
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
            >
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
  checkboxItemIndented: {
    width: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[5]}`,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
      borderRadius: theme.radius.sm,
    },
  },
});
