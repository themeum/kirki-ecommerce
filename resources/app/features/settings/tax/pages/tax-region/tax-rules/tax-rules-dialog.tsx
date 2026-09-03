import { zodResolver } from '@hookform/resolvers/zod';
import { LightningBoltIcon } from '@radix-ui/react-icons';
import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type {
  SelectOption,
  TaxConditionRow,
  TaxRegionState,
  TaxRule,
} from '@/features/settings/tax/lib/utils';
import { taxRuleActionOptionsArray } from '@/features/settings/tax/lib/utils';
import ConditionRow from '@/features/settings/tax/pages/tax-region/tax-rules/condition-row';
import {
  type TaxRulesFormInput,
  type TaxRulesFormPayload,
  TaxRulesFormSchema,
} from '@/features/settings/tax/schemas/forms/tax-rules-form';
import { useTaxProfilesQuery } from '@/features/settings/tax/services/tax';
import { uuid } from '@/utils';
import { __ } from '@/wpi18n';

type TaxRulesDialogProps = {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  rules: TaxRule[];
  updateTaxRules: (rulesList: TaxRule[]) => void;
  from?: string;
  ruleIndex?: number;
  states: TaxRegionState[];
  destinationLabel?: string;
  conditionOptions: SelectOption[];
};

type ConditionOption = {
  title: string;
  value: string;
  id?: number | string;
};

const TaxRulesDialog = (props: TaxRulesDialogProps) => {
  const {
    showModal,
    setShowModal,
    rules,
    updateTaxRules,
    from = '',
    ruleIndex,
    states,
    destinationLabel,
    conditionOptions,
  } = props;

  const { data: taxProfiles } = useTaxProfilesQuery();

  const form = useForm<TaxRulesFormInput, unknown, TaxRulesFormPayload>({
    resolver: zodResolver(TaxRulesFormSchema),
    defaultValues: {
      conditions: [
        {
          id: uuid(),
          condition: 'tax_profile',
          value: null,
        },
      ],
      action_type: 'set_tax_rate',
      action_value: '',
      selectedCountries: [],
    },
  });

  const conditions = form.watch('conditions') as TaxConditionRow[];
  const selectedAction = form.watch('action_type');
  const selectedCountries = form.watch('selectedCountries');

  useEffect(() => {
    if (!showModal) {
      return;
    }

    if (from === 'edit' && ruleIndex !== undefined && rules?.[ruleIndex]) {
      const existingRule = rules[ruleIndex];
      const existingConditions = existingRule.conditions ?? [];
      const destinationCondition = existingConditions.find(
        (c) => c.type === 'destination_region',
      );

      form.reset({
        conditions: existingConditions.map((c) => ({
          id: uuid(),
          condition: c.type ?? 'tax_profile',
          value: c.value ?? null,
        })),
        action_type: existingRule.action?.type || 'set_tax_rate',
        action_value:
          (existingRule.action?.value as string | number) ?? '',
        selectedCountries: Array.isArray(destinationCondition?.value)
          ? (destinationCondition.value as (string | number)[])
          : [],
      });
      return;
    }

    form.reset({
      conditions: [
        { id: uuid(), condition: 'tax_profile', value: null },
      ],
      action_type: 'set_tax_rate',
      action_value: '',
      selectedCountries: [],
    });
  }, [showModal, from, ruleIndex, rules, form]);

  const setConditions: Dispatch<SetStateAction<TaxConditionRow[]>> = (
    updater,
  ) => {
    const current = form.getValues('conditions') as TaxConditionRow[];
    const next = typeof updater === 'function' ? updater(current) : updater;
    form.setValue('conditions', next, { shouldDirty: true });
  };

  const setSelectedCountries: Dispatch<
    SetStateAction<(string | number)[]>
  > = (updater) => {
    const current = form.getValues('selectedCountries');
    const next = typeof updater === 'function' ? updater(current) : updater;
    form.setValue('selectedCountries', next, { shouldDirty: true });
  };

  const handleSubmit = (rule: TaxRulesFormPayload) => {
    const currentRules = Array.isArray(rules) ? rules : [];
    const updatedRules =
      from === 'edit' && typeof ruleIndex === 'number'
        ? currentRules.map((existingRule, index) =>
          index === ruleIndex ? (rule as TaxRule) : existingRule,
        )
        : [...currentRules, rule as TaxRule];

    updateTaxRules(updatedRules);
    setShowModal(false);
  };

  const getConditionValue = (condition: string): ConditionOption[] => {
    if (condition === 'tax_profile') {
      return (
        taxProfiles?.map((item) => ({
          title: item.name,
          value: item.name,
          id: item.id,
        })) ?? []
      );
    }
    return [];
  };

  const actionOptions = taxRuleActionOptionsArray.map((option) => ({
    label: option.title,
    value: option.value,
  }));

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent>
        <DialogCloseButton />
        {from !== 'edit' && (
          <DialogHeader>
            <DialogTitle>
              <Flex gap={2} align="center">
                <LightningBoltIcon />
                {__('New Tax Rules', 'kirki-ecommerce')}
              </Flex>
            </DialogTitle>
          </DialogHeader>
        )}
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <Flex direction="column" gap={2}>
                {conditions?.map((row, index) => (
                  <ConditionRow
                    key={row.id}
                    row={row}
                    index={index}
                    conditions={conditions}
                    setConditions={setConditions}
                    getConditionValue={getConditionValue}
                    conditionOptions={conditionOptions}
                    selectedCountries={selectedCountries}
                    setSelectedCountries={setSelectedCountries}
                    from={from}
                    states={states}
                    destinationLabel={destinationLabel}
                  />
                ))}
              </Flex>
              <Flex direction="column" gap={2}>
                <Text>{__('THEN', 'kirki-ecommerce')}</Text>
                <Grid columns={2}>
                  <SelectField name="action_type" options={actionOptions} />
                  {selectedAction === 'set_tax_rate' && (
                    <TextField
                      name="action_value"
                      placeholder={__('e.g., $100', 'kirki-ecommerce')}
                    />
                  )}
                </Grid>
              </Flex>
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
            >
              {from === 'edit'
                ? __('Update', 'kirki-ecommerce')
                : __('Add Rule', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

TaxRulesDialog.displayName = 'TaxRulesDialog';

export default TaxRulesDialog;
