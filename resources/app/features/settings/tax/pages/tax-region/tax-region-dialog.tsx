import type { Dispatch, SetStateAction } from 'react';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { useTaxRegionDialog } from '@/features/settings/tax/hooks/use-tax-region-dialog';
import type {
  SelectedTaxRegionDraft,
  TaxRegion,
} from '@/features/settings/tax/lib/utils';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import type { FormErrors } from '@/types/pages/common';
import { noop } from '@/utils/function';
import { __, sprintf } from '@/wpi18n';

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
    setSelectedCountries = noop,
    setSelectedRegion = noop,
    selectedRegion = [],
    onAdd = noop,
  } = props;

  const {
    form,
    filteredCountries,
    formCountries,
    formRegions,
    buttonState,
    handleSelectCountries,
    handleSelectStates,
    handleSearchRegion,
    handleClose,
    handleSubmit,
  } = useTaxRegionDialog({
    openPopup,
    setOpenPopup,
    regions,
    selectedCountries,
    setSelectedCountries,
    setSelectedRegion,
    selectedRegion,
    onAdd,
  });

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
          <DialogTitle>{__('Add tax region', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={2}>
              <Label htmlFor="tax-region-search">
                {__('Select countries', 'kirki-ecommerce')}
              </Label>
              <Input
                id="tax-region-search"
                type="search"
                placeholder="Cities"
                onChange={(e) => handleSearchRegion(e.target.value)}
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
                  {__('Name', 'kirki-ecommerce')}
                </Flex>

                {filteredCountries?.length > 0 &&
                  filteredCountries?.map((country, index) => {
                    const regionInfo = formRegions.find(
                      (region) => region?.country === country.code,
                    );
                    const countryStates = (country.states ??
                      []) as CountryStateOption[];
                    return (
                      <div key={index} css={scoped(styles.checkboxItem)}>
                        <Flex gap={2} align="center">
                          <Checkbox
                            id={`tax-region-country-${country.code}`}
                            checked={
                              regionInfo?.hasDeselectedState
                                ? 'indeterminate'
                                : formCountries?.includes(country?.code)
                            }
                            onCheckedChange={() =>
                              handleSelectCountries(country)
                            }
                          />
                          <Label htmlFor={`tax-region-country-${country.code}`}>
                            {country?.flag}
                            {sprintf(__('%s', 'kirki-ecommerce'), country.name)}
                          </Label>
                        </Flex>
                        {formCountries?.includes(country.code) &&
                        countryStates.length > 0 ? (
                          <div css={scoped(styles.nestedStates)}>
                            {countryStates.map((state, stateIndex) => {
                              return (
                                <div key={stateIndex} css={scoped(styles.checkboxItem)}>
                                  <Flex gap={2} align="center">
                                    <Checkbox
                                      id={`tax-region-state-${country.code}-${state?.id}`}
                                      checked={formRegions
                                        ?.find((r) => r.id === country.code)
                                        ?.states.some((s) => s.id === state?.id)}
                                      onCheckedChange={() =>
                                        handleSelectStates(
                                          state.id,
                                          country.code,
                                          countryStates,
                                          state?.flag,
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor={`tax-region-state-${country.code}-${state?.id}`}
                                    >
                                      {sprintf(
                                        __('%s', 'kirki-ecommerce'),
                                        state.name,
                                      )}
                                    </Label>
                                  </Flex>
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
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={!buttonState}
            >
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

TaxRegionPopup.displayName = 'TaxRegionPopup';

export default TaxRegionPopup;

const styles = defineStyles({
  checkboxItem: {
    width: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
      borderRadius: theme.radius.sm,
    },
  },
  nestedStates: {
    padding: theme.spacing[3],
  },
});
