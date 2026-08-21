import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogClose, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  applyDestinationToRule,
  type DestinationConditionValue,
  filterStates,
  getCountryOptions,
  resolveOpenSelection,
  resolveStatesForCountry,
  toggleState,
  updateRegionStates,
} from '@/features/settings/shipping/lib/shipping-rules/destination-selection';
import {
  type SelectDestinationFormInput,
  type SelectDestinationFormPayload,
  SelectDestinationFormSchema,
} from '@/features/settings/shipping/schemas/forms/select-destination-form';
import type { CountryWithStates, ShippingRegion, ShippingRule } from '@/features/settings/shipping/types';
import { getDefaults } from '@/libs/zod';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

export type { DestinationConditionValue };

type SelectDestinationPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  selectedRegion: ShippingRegion[];
  selectedCountry: string | null;
  setSelectedCountry: Dispatch<SetStateAction<string | null>>;
  setSelectedRegion: Dispatch<SetStateAction<ShippingRegion[]>>;
  selectedConditionValue: DestinationConditionValue | null;
  setSelectedConditionValue: Dispatch<
    SetStateAction<DestinationConditionValue | null>
  >;
  setRulesObj: Dispatch<SetStateAction<ShippingRule[]>>;
  ruleIndex: number;
  onSave?: (values: SelectDestinationFormPayload) => void;
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
    { id: string | number; name: string }[]
  >([]);

  const form = useForm<SelectDestinationFormInput, unknown, SelectDestinationFormPayload>({
    resolver: zodResolver(SelectDestinationFormSchema),
    defaultValues: getDefaults(SelectDestinationFormSchema),
  });

  const formCountry = useWatch({ control: form.control, name: 'country' });
  const selectedStates =
    useWatch({ control: form.control, name: 'states' }) ?? [];
  const [searchValue, setSearchValue] = useState('');

  const countryOptions = useMemo(
    () => getCountryOptions(countryList, selectedRegion),
    [countryList, selectedRegion],
  );

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    form.reset(resolveOpenSelection(selectedCountry, selectedConditionValue, selectedRegion));
    setSearchValue('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds the form from the current selection only as the dialog opens; tracking the selection would reset the form while the user is picking states
  }, [openPopup, form]);

  useEffect(() => {
    if (!formCountry) {
      setStateList([]);
      return;
    }

    const { stateList: nextStateList, states } = resolveStatesForCountry(
      formCountry,
      selectedConditionValue,
      selectedRegion,
      countryList,
    );

    setStateList(nextStateList);
    form.setValue('states', states);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to a country change only; adding the selection deps would re-apply the stored states over the user current picks
  }, [formCountry, countryList]);

  const filteredStates = useMemo(
    () => filterStates(stateList, searchValue),
    [stateList, searchValue],
  );

  const handleSelectState = (stateId: string | number) => {
    const current = form.getValues('states') ?? [];
    form.setValue('states', toggleState(current, stateId), { shouldDirty: true });
  };

  const updateRegionList = (values: SelectDestinationFormPayload) => {
    setSelectedCountry(values.country);
    setSelectedRegion((prev) => updateRegionStates(prev, values));

    if (onSave) {
      onSave(values);
    } else if (ruleIndex !== -1) {
      setRulesObj((prev) => applyDestinationToRule(prev, ruleIndex, values));
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
