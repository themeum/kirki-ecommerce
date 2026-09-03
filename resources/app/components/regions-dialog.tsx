import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import TextField from '@/components/form/text-field';
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
import EmptyState from '@/components/ui/empty-state';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import { SearchIcon } from '@/icons';
import { getDefaults } from '@/libs/zod';
import type { Country } from '@/schemas/reference/country';
import {
  type Region,
  type RegionsDialogFormInput,
  type RegionsDialogFormPayload,
  RegionsDialogFormSchema,
} from '@/schemas/shared/region';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import type { FormErrors } from '@/types/pages/common';
import { getSearchedCountries } from '@/utils/region';
import { __, sprintf } from '@/wpi18n';

type RegionsDialogDefaultValue = {
  countryCodes?: string[];
  regions?: Region[];
  title?: string;
};

type RegionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countries: Country[];
  defaultValue?: RegionsDialogDefaultValue;
  dialogTitle?: string;
  from?: 'add' | 'edit' | '';
  enableEuropeanRegion?: boolean;
  disabledRegions?: Region[];
  /**
   * Country-only selection: no per-state expander, each picked country
   * contributes itself with an empty `states` array, and a country that
   * already has a region is disabled outright. Used by the tax-region add
   * flow; omitted by shipping zones and coupon targeting.
   */
  countryOnly?: boolean;
  onDone: (values: RegionsDialogFormPayload) => void;
  errors?: FormErrors;
};

const emptyDefaultValue: RegionsDialogDefaultValue = {
  countryCodes: [],
  regions: [],
  title: '',
};

const EU_REGION_CODE = 'EU';
const emptyStateIds: Set<string> = new Set();

export const RegionsDialog = ({
  open,
  onOpenChange,
  countries,
  defaultValue = emptyDefaultValue,
  dialogTitle = __('Add region', 'kirki-ecommerce'),
  from = '',
  enableEuropeanRegion = false,
  disabledRegions,
  countryOnly = false,
  onDone,
  errors,
}: RegionsDialogProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);

  const displayCountries = useMemo<Country[]>(() => {
    if (!enableEuropeanRegion) {
      return countries;
    }

    const euMembers = countries.filter((country) => country.group === 'eu');

    if (!euMembers.length) {
      return countries;
    }

    const euRegion: Country = {
      name: __('European Union', 'kirki-ecommerce'),
      code: EU_REGION_CODE,
      flag: '🇪🇺',
      states: euMembers.map((member) => ({
        id: member.name,
        name: member.name,
        code: member.code,
        flag: member.flag,
      })),
    };

    return [euRegion, ...countries.filter((country) => country.group !== 'eu')];
  }, [countries, enableEuropeanRegion]);

  const disabledStateMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    (disabledRegions ?? []).forEach((region) => {
      map.set(region.country, new Set(region.states.map(String)));
    });
    return map;
  }, [disabledRegions]);

  const isEuRegionRow = (countryCode: string) =>
    enableEuropeanRegion && countryCode === EU_REGION_CODE;

  const getDisabledStateIds = (countryCode: string) =>
    disabledStateMap.get(countryCode) ?? emptyStateIds;

  const isStateDisabled = (countryCode: string, stateId: string | number) =>
    getDisabledStateIds(countryCode).has(String(stateId));

  const isCountryFullyDisabled = (country: Country) => {
    if (countryOnly) {
      return disabledStateMap.has(country.code);
    }

    const disabledIds = disabledStateMap.get(country.code);

    if (!disabledIds) {
      return false;
    }

    const states = country.states ?? [];

    if (!states.length) {
      return true;
    }

    return states.every((state) => disabledIds.has(String(state.id)));
  };

  const getSelectableStates = (country: Country) => {
    const disabledIds = disabledStateMap.get(country.code);
    const states = country.states ?? [];

    if (!disabledIds) {
      return states;
    }

    return states.filter((state) => !disabledIds.has(String(state.id)));
  };

  const form = useForm<RegionsDialogFormInput, unknown, RegionsDialogFormPayload>({
    resolver: zodResolver(RegionsDialogFormSchema),
    defaultValues: getDefaults(RegionsDialogFormSchema),
  });

  const formCountries = useWatch({ control: form.control, name: 'countries' }) || [];
  const formRegions = useWatch({ control: form.control, name: 'regions' }) || [];
  const formTitle = useWatch({ control: form.control, name: 'title' }) || '';

  useEffect(() => {
    setExpandedCountries([]);

    if (!open) {
      return;
    }

    form.reset({
      title: defaultValue.title ?? '',
      countries: defaultValue.countryCodes ?? [],
      regions: defaultValue.regions ?? [],
    });
  }, [form, defaultValue, open]);

  useEffect(() => {
    if (errors?.title) {
      form.setError('title', { message: String(errors.title) });
    }
    if (errors?.regions) {
      form.setError('regions', { message: String(errors.regions) });
    }
  }, [errors, form]);

  const handleSelectCountries = (country: Country) => {
    if (isCountryFullyDisabled(country)) {
      return;
    }

    const countryCodes = form.getValues('countries') || [];
    const regions = form.getValues('regions') || [];
    const allStates = getSelectableStates(country);
    const regionInfo = regions.find((r) => r.country === country.code);
    const isFullySelected = Boolean(regionInfo) && !regionInfo?.hasDeselectedState;

    if (isFullySelected) {
      form.setValue(
        'countries',
        countryCodes.filter((countryCode) => countryCode !== country.code),
        { shouldValidate: true },
      );
      form.setValue(
        'regions',
        regions.filter((region) => region.country !== country.code),
        { shouldValidate: true },
      );
      setExpandedCountries((prev) => prev.filter((c) => c !== country.code));
      return;
    }

    const selectedRegion = {
      country: country.code,
      states: countryOnly ? [] : allStates.map((state) => state.id),
      hasDeselectedState: false,
      flag: country?.flag,
    };

    const nextCountryCodes = countryCodes.includes(country.code)
      ? countryCodes
      : [...countryCodes, country.code];

    const nextRegions = regionInfo
      ? regions.map((region) => (region.country === country.code ? selectedRegion : region))
      : [...regions, selectedRegion];

    form.setValue('countries', nextCountryCodes, { shouldValidate: true });
    form.setValue('regions', nextRegions, { shouldValidate: true });

    if (!countryOnly && allStates.length > 0) {
      setExpandedCountries((prev) =>
        prev.includes(country.code) ? prev : [...prev, country.code],
      );
    }
  };

  const handleCountryRowClick = (country: Country) => {
    if (isCountryFullyDisabled(country)) {
      return;
    }

    if (countryOnly || isEuRegionRow(country.code) || (country.states?.length ?? 0) === 0) {
      handleSelectCountries(country);
      return;
    }

    setExpandedCountries((prev) =>
      prev.includes(country.code)
        ? prev.filter((countryCode) => countryCode !== country.code)
        : [...prev, country.code],
    );
  };

  const handleSelectStates = (stateId: string | number, country: Country) => {
    if (isEuRegionRow(country.code) || isStateDisabled(country.code, stateId)) {
      return;
    }

    const regions = form.getValues('regions') || [];
    const countryCodes = form.getValues('countries') || [];
    const allStates = getSelectableStates(country);
    const countryCode = country.code;
    const countryIndex = regions.findIndex((item) => item.country === countryCode);

    if (countryIndex === -1) {
      const nextCountryCodes = countryCodes.includes(countryCode)
        ? countryCodes
        : [...countryCodes, countryCode];

      form.setValue('countries', nextCountryCodes, { shouldValidate: true });
      form.setValue(
        'regions',
        [
          ...regions,
          {
            country: countryCode,
            states: [stateId],
            hasDeselectedState: allStates.length !== 1,
            flag: country?.flag,
          },
        ],
        { shouldValidate: true },
      );
      return;
    }

    const countryItem = regions[countryIndex];
    const stateExists = countryItem.states.includes(stateId);

    const updatedStates = stateExists
      ? countryItem.states.filter((id) => id !== stateId)
      : [...countryItem.states, stateId];

    if (updatedStates.length === 0) {
      const nextCountryCodes = countryCodes.filter((country) => country !== countryCode);
      const nextRegions = regions.filter((_, i) => i !== countryIndex);
      form.setValue('countries', nextCountryCodes, { shouldValidate: true });
      form.setValue('regions', nextRegions, { shouldValidate: true });
      return;
    }

    const hasDeselectedState = updatedStates.length !== allStates.length;
    const nextRegions = regions.map((item, index) =>
      index === countryIndex
        ? {
            ...item,
            states: updatedStates,
            hasDeselectedState,
          }
        : item,
    );

    form.setValue('regions', nextRegions, { shouldValidate: true });
  };

  const handleCancelButton = () => {
    form.reset({
      title: defaultValue.title ?? '',
      countries: defaultValue.countryCodes ?? [],
      regions: defaultValue.regions ?? [],
    });
    onOpenChange(false);
  };

  const filteredCountries = getSearchedCountries(searchValue, displayCountries);

  const buttonState =
    (from === 'add' && !String(formTitle || '').trim()) || formCountries.length === 0;

  const searchError = form.formState.errors.regions?.message || (errors?.regions as string) || '';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            {from === 'add' && (
              <TextField
                name="title"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__('Zone 2 - South Asia', 'kirki-ecommerce')}
              />
            )}

            <Flex direction="column" gap={2}>
              <Label htmlFor="regions-dialog-search">
                {__('Select countries', 'kirki-ecommerce')}
                {formCountries.length > 0 && (
                  <Text variant="tiny" color="subdued">
                    {sprintf('(%s)', formCountries.length)}
                  </Text>
                )}
              </Label>
              <Input
                id="regions-dialog-search"
                type="search"
                placeholder={__('Search country or state', 'kirki-ecommerce')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                error={Boolean(searchError)}
              />
            </Flex>

            <Card cssOverride={cardStyles.tableCardRounded}>
              <CardContent cssOverride={cardStyles.tableContent}>
                <div css={scoped(styles.scrollArea)}>
                  {filteredCountries?.length > 0 ? (
                    filteredCountries.map((country) => {
                      const regionInfo = formRegions.find(
                        (region) => region.country === country.code,
                      );
                      const euRow = isEuRegionRow(country.code);
                      const countryDisabled = isCountryFullyDisabled(country);
                      const disabledStateIds = getDisabledStateIds(country.code);
                      const hasStates = !countryOnly && (country?.states?.length ?? 0) > 0;
                      const selectedStateCount = regionInfo?.states?.length ?? 0;
                      const hasDisabledStates = !countryDisabled && disabledStateIds.size > 0;
                      const isExpanded =
                        hasStates &&
                        (expandedCountries.includes(country.code) ||
                          formCountries.includes(country.code) ||
                          hasDisabledStates);
                      const countryRowContent = (
                        <>
                          <Flex align="center" gap={2}>
                            <Checkbox
                              id={`regions-dialog-country-${country.code}`}
                              disabled={countryDisabled}
                              checked={
                                countryDisabled
                                  ? regionInfo?.hasDeselectedState
                                    ? 'indeterminate'
                                    : true
                                  : !euRow && regionInfo?.hasDeselectedState
                                    ? 'indeterminate'
                                    : formCountries.includes(country?.code)
                              }
                              onCheckedChange={() => handleSelectCountries(country)}
                            />
                            <Label cssOverride={styles.countryLabel}>
                              <span css={scoped(styles.flag)}>{country?.flag}</span>
                              {country.name}
                            </Label>
                            {hasStates && selectedStateCount > 0 && (
                              <Text variant="tiny" color="subdued">
                                {sprintf('(%s)', selectedStateCount)}
                              </Text>
                            )}
                          </Flex>
                          {hasStates && !countryDisabled && (
                            <div
                              css={scoped(styles.chevron)}
                              style={{ transform: isExpanded ? 'rotate(180deg)' : undefined }}
                            >
                              <ChevronDown size={16} />
                            </div>
                          )}
                        </>
                      );
                      return (
                        <div key={country.code}>
                          <div css={scoped(styles.checkboxItem)}>
                            {countryDisabled ? (
                              <Tooltip
                                tip={__('Already in use', 'kirki-ecommerce')}
                                position="right"
                                cssOverride={styles.disabledRowTrigger}
                              >
                                <Flex gap={2} align="center">
                                  {countryRowContent}
                                </Flex>
                              </Tooltip>
                            ) : (
                              <Flex
                                gap={2}
                                align="center"
                                onClick={() => handleCountryRowClick(country)}
                                cssOverride={styles.countryRow}
                              >
                                {countryRowContent}
                              </Flex>
                            )}
                          </div>
                          {isExpanded ? (
                            <div css={scoped(styles.nestedStates)}>
                              {(country?.states ?? []).map((state) => {
                                const stateUsed = disabledStateIds.has(String(state.id));
                                const stateRow = (
                                  <Flex gap={2} align="center">
                                    <Checkbox
                                      id={`regions-dialog-state-${country.code}-${state.id}`}
                                      disabled={euRow || stateUsed}
                                      checked={
                                        stateUsed ||
                                        formRegions
                                          ?.find((r) => r.country === country.code)
                                          ?.states.includes(state.id)
                                      }
                                      onCheckedChange={() => handleSelectStates(state.id, country)}
                                    />
                                    <Label
                                      htmlFor={`regions-dialog-state-${country.code}-${state.id}`}
                                    >
                                      {state.name}
                                    </Label>
                                  </Flex>
                                );
                                return (
                                  <div
                                    key={`${country.code}-${state.id}`}
                                    css={scoped(styles.checkboxItem)}
                                  >
                                    {stateUsed ? (
                                      <Tooltip
                                        tip={__('Already in use', 'kirki-ecommerce')}
                                        position="right"
                                        cssOverride={styles.disabledRowTrigger}
                                      >
                                        {stateRow}
                                      </Tooltip>
                                    ) : (
                                      stateRow
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon={<SearchIcon />}
                      text={__('No country or state available', 'kirki-ecommerce')}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCancelButton()}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={form.handleSubmit(onDone)} disabled={buttonState}>
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

RegionsDialog.displayName = 'RegionsDialog';

const styles = defineStyles({
  scrollArea: {
    height: '432px',
    overflowX: 'hidden',
    overflowY: 'scroll',
  },
  checkboxItem: {
    width: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
      borderRadius: theme.radius.sm,
    },
  },
  nestedStates: {
    padding: `${theme.spacing[0]} ${theme.spacing[3]}`,
  },
  countryLabel: {
    cursor: 'pointer',
  },
  flag: {
    flexShrink: 0,
  },
  countryRow: {
    cursor: 'pointer',
  },
  chevron: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    color: theme.colors.text.subdued,
    transition: 'transform 0.2s ease',
  },
  disabledRowTrigger: {
    display: 'flex',
    width: '100%',
    cursor: 'not-allowed',
  },
});
