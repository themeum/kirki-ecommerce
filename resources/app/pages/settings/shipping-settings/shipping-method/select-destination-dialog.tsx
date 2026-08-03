import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import SelectField from '@/components/form/select-field';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { scoped, defineStyles } from '@/theme/mixins';
import { SelectDestinationFormSchema, selectDestinationDefaultValues, type SelectDestinationFormValues } from '@/schemas/forms/select-destination-form';
import { useCountriesQuery } from '@/services/country';
import { __ } from '@/wpi18n';

import type {
  CountryWithStates,
  ShippingRegion,
  ShippingRule,
} from '@/pages/settings/shipping-settings/utils';

type DestinationConditionValue = {
  country: string;
  states: Array<string | number>;
};

type SelectDestinationPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  selectedRegion: ShippingRegion[];
  selectedCountry: string | null;
  setSelectedCountry: Dispatch<SetStateAction<string | null>>;
  setSelectedRegion: Dispatch<SetStateAction<ShippingRegion[]>>;
  selectedConditionValue: DestinationConditionValue | unknown;
  setSelectedConditionValue: Dispatch<SetStateAction<unknown>>;
  setRulesObj: Dispatch<SetStateAction<ShippingRule[]>>;
  ruleIndex: number;
  onSave?: (values: SelectDestinationFormValues) => void;
};

export const SelectDestinationPopup = ({
  openPopup,
  setOpenPopup,
  selectedRegion,
  selectedCountry,
  setSelectedCountry,
  setSelectedRegion,
  selectedConditionValue,
  setSelectedConditionValue,
  setRulesObj,
  ruleIndex,
  onSave,
}: SelectDestinationPopupProps) => {
  const { data: countries } = useCountriesQuery({ limit: -1 });
  const countryList = countries as CountryWithStates[] | null | undefined;
  const [stateList, setStateList] = useState<
    Array<{ id: string | number; name: string }>
  >([]);

  const form = useForm<SelectDestinationFormValues>({
    resolver: zodResolver(SelectDestinationFormSchema),
    defaultValues: selectDestinationDefaultValues,
  });

  const formCountry = useWatch({ control: form.control, name: 'country' });
  const selectedStates =
    useWatch({ control: form.control, name: 'states' }) || [];
  const [searchValue, setSearchValue] = useState('');

  const countryOptions = useMemo(
    () =>
      countryList
        ?.filter((country) =>
          selectedRegion?.some((region) => region.country === country.code),
        )
        .map((country) => ({
          label: country.name,
          value: country.code,
        })) ?? [],
    [countryList, selectedRegion],
  );

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    const country = selectedCountry ?? '';
    const conditionValue = selectedConditionValue as
      | DestinationConditionValue
      | null;
    const statesFromCondition =
      conditionValue?.country === country ? conditionValue.states : null;
    const regionForCountry = selectedRegion?.find(
      (r) => r.country.toLowerCase() === country.toLowerCase(),
    );

    form.reset({
      country,
      states: statesFromCondition ?? regionForCountry?.states ?? [],
    });
    setSearchValue('');
  }, [openPopup, form]);

  useEffect(() => {
    if (!formCountry) {
      setStateList([]);
      return;
    }

    const country = countryList?.find(
      (item) => item.code.toLowerCase() === formCountry.toLowerCase(),
    );

    setStateList(country?.states || []);

    const conditionValue = selectedConditionValue as
      | DestinationConditionValue
      | null;
    const statesFromCondition =
      conditionValue?.country === formCountry ? conditionValue.states : null;
    const regionForCountry = selectedRegion?.find(
      (r) => r.country.toLowerCase() === formCountry.toLowerCase(),
    );

    form.setValue(
      'states',
      statesFromCondition ?? regionForCountry?.states ?? [],
    );
  }, [formCountry, countryList]);

  const filteredStates = useMemo(() => {
    if (!searchValue.trim()) {
      return stateList;
    }
    const query = searchValue.toLowerCase();
    return stateList.filter((state) =>
      state.name.toLowerCase().includes(query),
    );
  }, [stateList, searchValue]);

  const handleSelectState = (stateId: string | number) => {
    const current = form.getValues('states') || [];
    const next = current.includes(stateId)
      ? current.filter((id) => id !== stateId)
      : [...current, stateId];
    form.setValue('states', next, { shouldDirty: true });
  };

  const updateRegionList = (values: SelectDestinationFormValues) => {
    setSelectedCountry(values.country);
    setSelectedRegion((prev) =>
      prev.map((r) =>
        r.country === values.country ? { ...r, states: values.states } : r,
      ),
    );

    if (onSave) {
      onSave(values);
    } else if (ruleIndex !== -1) {
      setRulesObj((prev) =>
        prev.map((rule, idx) => {
          if (idx !== ruleIndex) {
            return rule;
          }

          const condition = rule.conditions?.[0];
          if (!condition || condition.type !== 'destination_region') {
            return rule;
          }

          const conditionValue = condition.value as DestinationConditionValue;
          const isSameCountry = conditionValue?.country === values.country;

          return {
            ...rule,
            conditions: [
              {
                ...condition,
                value: isSameCountry
                  ? {
                      ...conditionValue,
                      states: values.states,
                    }
                  : {
                      country: values.country,
                      states: values.states,
                    },
              },
            ],
          };
        }),
      );
    } else {
      setSelectedConditionValue({
        country: values.country,
        states: values.states || [],
      });
    }
    setOpenPopup(false);
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
            <SelectField
              name="country"
              label={__('Select country', 'kirki-ecommerce')}
              options={countryOptions}
            />

            <Flex direction="column" gap={2}>
              <Label htmlFor="select-destination-search">
                {__('Regions', 'kirki-ecommerce')}
              </Label>
              <Input
                id="select-destination-search"
                type="search"
                placeholder={__('Search region or state', 'kirki-ecommerce')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Flex>

            <div
              style={{
                height: '350px',
                overflowX: 'hidden',
                overflowY: 'scroll',
              }}
            >
              {filteredStates?.map((state, index) => (
                <div key={index} css={scoped(styles.checkboxItem)}>
                  <Flex gap={2} align="center">
                    <Checkbox
                      id={`select-destination-state-${index}`}
                      checked={selectedStates.includes(state.id)}
                      onCheckedChange={() => handleSelectState(state?.id)}
                    />
                    <Label htmlFor={`select-destination-state-${index}`}>
                      {state.name}
                    </Label>
                  </Flex>
                </div>
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              onClick={form.handleSubmit(updateRegionList)}
            >
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

SelectDestinationPopup.displayName = 'SelectDestinationPopup';

const styles = defineStyles({
  checkboxItem: {
    width: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
      borderRadius: theme.radius.sm,
    },
  },
});
