import { zodResolver } from '@hookform/resolvers/zod';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown } from 'lucide-react';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';

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
import type { Country, State } from '@/schemas/reference/country';
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

type RegionRow =
  | { type: 'country'; country: Country }
  | { type: 'state'; country: Country; state: State };

const emptyDefaultValue: RegionsDialogDefaultValue = {
  countryCodes: [],
  regions: [],
  title: '',
};

const emptyStateIds = new Set<string>();
const emptyCountryCodes: string[] = [];
const emptyRegions: Region[] = [];

const ROW_HEIGHT = 36;

type CountryRowProps = {
  country: Country;
  checked: boolean | 'indeterminate';
  disabled: boolean;
  expandable: boolean;
  expanded: boolean;
  selectedStateCount: number;
  onToggle: (country: Country) => void;
  onRowClick: (country: Country) => void;
};

const CountryRow = memo(
  ({
    country,
    checked,
    disabled,
    expandable,
    expanded,
    selectedStateCount,
    onToggle,
    onRowClick,
  }: CountryRowProps) => {
    const content = (
      <>
        <Flex align="center" gap={2}>
          <Checkbox
            id={`regions-dialog-country-${country.code}`}
            disabled={disabled}
            checked={checked}
            onCheckedChange={() => onToggle(country)}
          />
          <Label cssOverride={styles.countryLabel}>
            <span css={scoped(styles.flag)}>{country?.flag}</span>
            {country.name}
          </Label>
          {selectedStateCount > 0 && (
            <Text variant="tiny" color="subdued">
              {sprintf('(%s)', selectedStateCount)}
            </Text>
          )}
        </Flex>
        {expandable && (
          <div
            css={scoped(styles.chevron)}
            style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
          >
            <ChevronDown size={16} />
          </div>
        )}
      </>
    );

    return (
      <div css={scoped(styles.checkboxItem)}>
        {disabled ? (
          <Tooltip
            tip={__('Already in use', 'kirki-ecommerce')}
            position="right"
            cssOverride={styles.disabledRowTrigger}
          >
            <Flex gap={2} align="center">
              {content}
            </Flex>
          </Tooltip>
        ) : (
          <Flex
            gap={2}
            align="center"
            onClick={() => onRowClick(country)}
            cssOverride={styles.countryRow}
          >
            {content}
          </Flex>
        )}
      </div>
    );
  },
);

CountryRow.displayName = 'CountryRow';

type StateRowProps = {
  country: Country;
  state: State;
  checked: boolean;
  used: boolean;
  onToggle: (stateId: string | number, country: Country) => void;
};

const StateRow = memo(({ country, state, checked, used, onToggle }: StateRowProps) => {
  const row = (
    <Flex gap={2} align="center">
      <Checkbox
        id={`regions-dialog-state-${country.code}-${state.id}`}
        disabled={used}
        checked={checked}
        onCheckedChange={() => onToggle(state.id, country)}
      />
      <Label htmlFor={`regions-dialog-state-${country.code}-${state.id}`}>{state.name}</Label>
    </Flex>
  );

  return (
    <div css={scoped(styles.nestedStates)}>
      <div css={scoped(styles.checkboxItem)}>
        {used ? (
          <Tooltip
            tip={__('Already in use', 'kirki-ecommerce')}
            position="right"
            cssOverride={styles.disabledRowTrigger}
          >
            {row}
          </Tooltip>
        ) : (
          row
        )}
      </div>
    </div>
  );
});

StateRow.displayName = 'StateRow';

type DoneButtonProps = {
  requiresTitle: boolean;
  onClick: () => void;
};

const DoneButton = ({ requiresTitle, onClick }: DoneButtonProps) => {
  const { control } = useFormContext<RegionsDialogFormInput>();
  const title = useWatch({ control, name: 'title' }) || '';
  const selectedCountries = useWatch({ control, name: 'countries' }) || emptyCountryCodes;

  const disabled = (requiresTitle && !String(title).trim()) || selectedCountries.length === 0;

  return (
    <Button variant="primary" onClick={onClick} disabled={disabled}>
      {__('Done', 'kirki-ecommerce')}
    </Button>
  );
};

DoneButton.displayName = 'DoneButton';

export const RegionsDialog = ({
  open,
  onOpenChange,
  countries,
  defaultValue = emptyDefaultValue,
  dialogTitle = __('Add region', 'kirki-ecommerce'),
  from = '',
  disabledRegions,
  countryOnly = false,
  onDone,
  errors,
}: RegionsDialogProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const deferredSearchValue = useDeferredValue(searchValue);

  const disabledStateMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    (disabledRegions ?? []).forEach((region) => {
      map.set(region.country, new Set(region.states.map(String)));
    });
    return map;
  }, [disabledRegions]);

  const getDisabledStateIds = useCallback(
    (countryCode: string) => disabledStateMap.get(countryCode) ?? emptyStateIds,
    [disabledStateMap],
  );

  const isStateDisabled = useCallback(
    (countryCode: string, stateId: string | number) =>
      getDisabledStateIds(countryCode).has(String(stateId)),
    [getDisabledStateIds],
  );

  const isCountryFullyDisabled = useCallback(
    (country: Country) => {
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
    },
    [countryOnly, disabledStateMap],
  );

  const getSelectableStates = useCallback(
    (country: Country) => {
      const disabledIds = disabledStateMap.get(country.code);
      const states = country.states ?? [];

      if (!disabledIds) {
        return states;
      }

      return states.filter((state) => !disabledIds.has(String(state.id)));
    },
    [disabledStateMap],
  );

  const form = useForm<RegionsDialogFormInput, unknown, RegionsDialogFormPayload>({
    resolver: zodResolver(RegionsDialogFormSchema),
    defaultValues: getDefaults(RegionsDialogFormSchema),
  });

  const formCountries = useWatch({ control: form.control, name: 'countries' }) || emptyCountryCodes;
  const formRegions = useWatch({ control: form.control, name: 'regions' }) || emptyRegions;

  const selectedCountryCodes = useMemo(() => new Set(formCountries), [formCountries]);

  const regionByCountry = useMemo(() => {
    const map = new Map<string, Region>();
    formRegions.forEach((region) => map.set(region.country, region));
    return map;
  }, [formRegions]);

  const selectedStatesByCountry = useMemo(() => {
    const map = new Map<string, Set<string | number>>();
    formRegions.forEach((region) => map.set(region.country, new Set(region.states)));
    return map;
  }, [formRegions]);

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

  const handleSelectCountries = useCallback(
    (country: Country) => {
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
    },
    [countryOnly, form, getSelectableStates, isCountryFullyDisabled],
  );

  const handleCountryRowClick = useCallback(
    (country: Country) => {
      if (isCountryFullyDisabled(country)) {
        return;
      }

      if (countryOnly || (country.states?.length ?? 0) === 0) {
        handleSelectCountries(country);
        return;
      }

      setExpandedCountries((prev) =>
        prev.includes(country.code)
          ? prev.filter((countryCode) => countryCode !== country.code)
          : [...prev, country.code],
      );
    },
    [countryOnly, handleSelectCountries, isCountryFullyDisabled],
  );

  const handleSelectStates = useCallback(
    (stateId: string | number, country: Country) => {
      if (countryOnly || isStateDisabled(country.code, stateId)) {
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
    },
    [countryOnly, form, getSelectableStates, isStateDisabled],
  );

  const handleCancelButton = () => {
    form.reset({
      title: defaultValue.title ?? '',
      countries: defaultValue.countryCodes ?? [],
      regions: defaultValue.regions ?? [],
    });
    onOpenChange(false);
  };

  const filteredCountries = useMemo(
    () => getSearchedCountries(deferredSearchValue, countries),
    [countries, deferredSearchValue],
  );

  const rows = useMemo(() => {
    const items: RegionRow[] = [];

    filteredCountries.forEach((country) => {
      items.push({ type: 'country', country });

      const hasStates = !countryOnly && (country.states?.length ?? 0) > 0;

      if (!hasStates) {
        return;
      }

      const countryDisabled = isCountryFullyDisabled(country);
      const hasDisabledStates = !countryDisabled && getDisabledStateIds(country.code).size > 0;
      const isExpanded =
        expandedCountries.includes(country.code) ||
        selectedCountryCodes.has(country.code) ||
        hasDisabledStates;

      if (!isExpanded) {
        return;
      }

      (country.states ?? []).forEach((state) => {
        items.push({ type: 'state', country, state });
      });
    });

    return items;
  }, [
    countryOnly,
    expandedCountries,
    filteredCountries,
    getDisabledStateIds,
    isCountryFullyDisabled,
    selectedCountryCodes,
  ]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollAreaRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    getItemKey: (index) => {
      const row = rows[index];
      return row.type === 'country' ? row.country.code : `${row.country.code}-${row.state.id}`;
    },
    // Assumed size until the ResizeObserver reports the real one — avoids a
    // flash of zero rows on first paint, and (as a side effect) means jsdom,
    // which never fires ResizeObserver callbacks, still has enough rows to
    // interact with in tests.
    initialRect: { width: 480, height: 432 },
  });

  const searchError = form.formState.errors.regions?.message || (errors?.regions as string) || '';

  const renderRow = (row: RegionRow) => {
    if (row.type === 'state') {
      const { country, state } = row;
      const used = getDisabledStateIds(country.code).has(String(state.id));

      return (
        <StateRow
          country={country}
          state={state}
          used={used}
          checked={used || Boolean(selectedStatesByCountry.get(country.code)?.has(state.id))}
          onToggle={handleSelectStates}
        />
      );
    }

    const { country } = row;
    const regionInfo = regionByCountry.get(country.code);
    const countryDisabled = isCountryFullyDisabled(country);
    const hasStates = !countryOnly && (country.states?.length ?? 0) > 0;
    const hasDisabledStates = !countryDisabled && getDisabledStateIds(country.code).size > 0;
    const checked = countryDisabled
      ? regionInfo?.hasDeselectedState
        ? 'indeterminate'
        : true
      : !countryOnly && regionInfo?.hasDeselectedState
        ? 'indeterminate'
        : selectedCountryCodes.has(country.code);

    return (
      <CountryRow
        country={country}
        checked={checked}
        disabled={countryDisabled}
        expandable={hasStates && !countryDisabled}
        expanded={
          hasStates &&
          (expandedCountries.includes(country.code) ||
            selectedCountryCodes.has(country.code) ||
            hasDisabledStates)
        }
        selectedStateCount={hasStates ? (regionInfo?.states?.length ?? 0) : 0}
        onToggle={handleSelectCountries}
        onRowClick={handleCountryRowClick}
      />
    );
  };

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

            <Card
              cssOverride={{ boxShadow: 'none', borderRadius: theme.radius.md, paddingBlock: 0 }}
            >
              <CardContent cssOverride={cardStyles.tableContent}>
                <div ref={scrollAreaRef} css={scoped(styles.scrollArea)}>
                  {rows.length > 0 ? (
                    <div
                      style={{
                        height: virtualizer.getTotalSize(),
                        position: 'relative',
                        width: '100%',
                      }}
                    >
                      {virtualizer.getVirtualItems().map((virtualRow) => (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          css={scoped(styles.virtualRow)}
                          style={{ transform: `translateY(${virtualRow.start}px)` }}
                        >
                          {renderRow(rows[virtualRow.index])}
                        </div>
                      ))}
                    </div>
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
            <DoneButton requiresTitle={from === 'add'} onClick={form.handleSubmit(onDone)} />
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
    contain: 'strict',
  },
  virtualRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  checkboxItem: {
    width: 'auto',
    // Fixed so the virtualizer's estimate is exact: it positions rows from
    // `ROW_HEIGHT` alone, and a row that measured taller would overlap the
    // next one.
    height: `${ROW_HEIGHT}px`,
    boxSizing: 'border-box',
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
