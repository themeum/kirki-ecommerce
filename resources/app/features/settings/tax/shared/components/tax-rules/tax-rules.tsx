import { Edit3, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import {
  RuleItem,
  RuleItemAction,
  RuleItemActions,
  RuleItemCondition,
  RuleItemConditions,
  RuleItemContent,
  RuleItems,
  RuleItemValues,
} from '@/components/shared/rule-items';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useCategoriesQuery } from '@/features/categories';
import TaxRuleFormCard from '@/features/settings/tax/shared/components/tax-rules/tax-rule-form-card';
import {
  resolveActionLabel,
  resolveConditionDisplayValue,
  resolveConditionTypeLabel,
  resolveDestinationLabels,
  resolveOperatorLabel,
} from '@/features/settings/tax/shared/lib/tax-rules/helper';
import type { TaxRegionState, TaxRule } from '@/features/settings/tax/shared/lib/utils';
import { RATE_ACTIONS } from '@/features/settings/tax/shared/schemas/forms/tax-rules-form';
import { useTaxProfilesQuery } from '@/features/settings/tax/shared/services/tax';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const toSentenceCase = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

type TaxRulesProps = {
  /**
   * The rule set this section edits — a region's own rules in country-wide
   * mode, a single state's in per-state mode, the EU region's on the EU page.
   */
  rules: TaxRule[];
  /**
   * Destinations offered to a `destination_region` condition: a general
   * region's states, or the EU's member countries.
   */
  states: TaxRegionState[];
  destinationLabel?: string;
  /**
   * The country code a `destination_region` condition targets when the editor
   * belongs to a single-country general region — its selected states become
   * `{ country, state: [...] }`. Omitted on the EU page, where the selection is
   * a set of member countries stored as `{ country: [...] }`.
   */
  destinationCountry?: string;
  updateTaxRules: (rulesList: TaxRule[]) => void;
};

const TaxRules = (props: TaxRulesProps) => {
  const { rules, states, destinationLabel, destinationCountry, updateTaxRules } = props;
  const [addRuleModal, setAddRuleModal] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const { data: taxProfiles } = useTaxProfilesQuery();
  const { data: categoryData } = useCategoriesQuery({ limit: -1 });

  const handleDeleteRules = (_item: TaxRule, index: number) => {
    const initialRules = Array.isArray(rules) ? [...rules] : [];
    const updatedRules = initialRules.filter((_, i) => i !== index);
    updateTaxRules(updatedRules);
  };

  return (
    <div>
      <Card data-search-skip="true" cssOverride={cardStyles.formCard}>
        <CardContent>
          <HeaderActionsCard
            header={__('Tax Rules', 'kirki-ecommerce')}
            subHeader={__(
              'Define conditional rules to adjust tax prices based on product type, weight, zone, or cart value.',
              'kirki-ecommerce',
            )}
            buttonText={__('Add', 'kirki-ecommerce')}
            onAdd={() => setAddRuleModal(true)}
          />
          <div css={scoped(styles.conditionWrapper)}>
            {(addRuleModal || rules.length > 0) && (
              <Flex direction="column" gap={4}>
                {addRuleModal && (
                  <TaxRuleFormCard
                    onClose={() => setAddRuleModal(false)}
                    rules={rules}
                    updateTaxRules={updateTaxRules}
                    from="add"
                    states={states}
                    destinationLabel={destinationLabel}
                    destinationCountry={destinationCountry}
                  />
                )}

                <RuleItems cssOverride={styles.ruleItems}>
                  {rules?.map((item, index) =>
                    editingRuleIndex === index ? (
                      <TaxRuleFormCard
                        key={index}
                        states={states}
                        destinationLabel={destinationLabel}
                        destinationCountry={destinationCountry}
                        rules={rules}
                        updateTaxRules={updateTaxRules}
                        onClose={() => setEditingRuleIndex(null)}
                        from="edit"
                        ruleIndex={index}
                      />
                    ) : (
                      <RuleItem key={index} id={String(index)}>
                        <RuleItemContent>
                          <RuleItemConditions>
                            {(item?.conditions ?? []).map((condition, conditionIndex) => (
                              <RuleItemCondition key={conditionIndex}>
                                <Text variant="small" weight="medium">
                                  {conditionIndex === 0
                                    ? __('IF', 'kirki-ecommerce')
                                    : __('AND IF', 'kirki-ecommerce')}
                                </Text>
                                <Text variant="small" color="secondary">
                                  {sprintf(
                                    __('%1$s %2$s', 'kirki-ecommerce'),
                                    toSentenceCase(resolveConditionTypeLabel(condition?.type)),
                                    resolveOperatorLabel(condition?.operator),
                                  )}
                                </Text>
                                <RuleItemValues
                                  values={
                                    condition?.type === 'destination_region'
                                      ? resolveDestinationLabels(condition?.value, states)
                                      : [
                                          resolveConditionDisplayValue(
                                            condition,
                                            taxProfiles,
                                            categoryData?.results,
                                          ),
                                        ]
                                  }
                                />
                                <Text variant="small" weight="medium">
                                  ,
                                </Text>
                              </RuleItemCondition>
                            ))}
                          </RuleItemConditions>
                          <RuleItemAction>
                            <Text variant="small" weight="medium">
                              {__('Then', 'kirki-ecommerce')}
                            </Text>
                            <Text variant="small" color="secondary">
                              {resolveActionLabel(item?.action?.type)}
                            </Text>
                            {RATE_ACTIONS.includes(item?.action?.type ?? '') && (
                              <Text
                                variant="small"
                                weight="medium"
                                cssOverride={styles.conditionValue}
                              >
                                {item?.action?.value as string}
                              </Text>
                            )}
                          </RuleItemAction>
                        </RuleItemContent>
                        <RuleItemActions>
                          <ActionGroup>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleDeleteRules(item, index)}
                            >
                              <Trash2 />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => setEditingRuleIndex(index)}
                            >
                              <Edit3 />
                            </Button>
                          </ActionGroup>
                        </RuleItemActions>
                      </RuleItem>
                    ),
                  )}
                </RuleItems>
              </Flex>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

TaxRules.displayName = 'TaxRules';

/**
 * Memoized so a VAT edit — which re-renders the page shell through the form's
 * `isDirty` — does not drag this card into the same commit that unmounts the
 * VAT dialog. Both props are kept referentially stable by `EditRegionEU`.
 */
const MemoizedTaxRules = memo(TaxRules);

MemoizedTaxRules.displayName = 'TaxRules';

export default MemoizedTaxRules;

const styles = defineStyles({
  ruleItems: {
    marginTop: theme.spacing[5],
  },
  conditionValue: {
    color: theme.colors.text.special3,
  },
  conditionWrapper: {
    marginTop: theme.spacing[3],
  },
});
