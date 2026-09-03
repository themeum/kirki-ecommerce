import { LightningBoltIcon } from '@radix-ui/react-icons';
import { Edit3, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import {
  RuleItem,
  RuleItemAction,
  RuleItemActions,
  RuleItemBadge,
  RuleItemCondition,
  RuleItemConditions,
  RuleItemContent,
  RuleItems,
} from '@/components/shared/rule-items';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { getDestinationDisplayValue } from '@/features/settings/tax/lib/tax-rules/helper';
import type { SelectOption, TaxRegionState, TaxRule } from '@/features/settings/tax/lib/utils';
import { taxRuleConditionOptions } from '@/features/settings/tax/lib/utils';
import TaxRulesDialog from '@/features/settings/tax/pages/tax-region/tax-rules/tax-rules-dialog';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

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
  updateTaxRules: (rulesList: TaxRule[]) => void;
  /**
   * Condition types the rule editor offers. Defaults to Tax Profile plus
   * Destination; a state's page passes Tax Profile only.
   */
  conditionOptions?: SelectOption[];
};

const TaxRules = (props: TaxRulesProps) => {
  const {
    rules,
    states,
    destinationLabel,
    updateTaxRules,
    conditionOptions = taxRuleConditionOptions,
  } = props;
  const [addRuleModal, setAddRuleModal] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  const handleDeleteRules = (_item: TaxRule, index: number) => {
    const initialRules = Array.isArray(rules) ? [...rules] : [];
    const updatedRules = initialRules.filter((_, i) => i !== index);
    updateTaxRules(updatedRules);
  };

  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
          <HeaderActionsCard
            header={__('Tax Rules', 'kirki-ecommerce')}
            subHeader={__(
              'Define conditional rules to adjust tax prices based on product type, weight, zone, or cart value.',
              'kirki-ecommerce',
            )}
            buttonText={__('Add Rule', 'kirki-ecommerce')}
            onAdd={() => setAddRuleModal(true)}
          />
          {(addRuleModal || rules.length > 0) && (
            <Flex direction="column" gap={4}>
              {addRuleModal && (
                <TaxRulesDialog
                  showModal={addRuleModal}
                  setShowModal={setAddRuleModal}
                  rules={rules}
                  updateTaxRules={updateTaxRules}
                  from="add"
                  states={states}
                  destinationLabel={destinationLabel}
                  conditionOptions={conditionOptions}
                />
              )}
              <RuleItems cssOverride={styles.ruleItems}>
                {rules?.map((item, index) => (
                  <RuleItem key={index} id={String(index)}>
                    <RuleItemContent>
                      <RuleItemBadge>
                        <LightningBoltIcon width={12} height={12} />
                        <Text variant="small">
                          {sprintf(__('Rule %s', 'kirki-ecommerce'), index + 1)}
                        </Text>
                      </RuleItemBadge>
                      <RuleItemConditions>
                        {(item?.conditions ?? []).map((condition, conditionIndex) => (
                          <RuleItemCondition key={conditionIndex}>
                            <Text variant="small" weight="medium">
                              {conditionIndex === 0
                                ? sprintf(
                                    __('IF %1$s %2$s', 'kirki-ecommerce'),
                                    condition?.type ?? '',
                                    condition?.operator ?? '',
                                  )
                                : sprintf(
                                    __('AND IF %1$s %2$s', 'kirki-ecommerce'),
                                    condition?.type ?? '',
                                    condition?.operator ?? '',
                                  )}
                            </Text>
                            <Text
                              variant="small"
                              weight="medium"
                              cssOverride={styles.conditionValue}
                            >
                              {condition?.type === 'destination_region'
                                ? __(
                                    getDestinationDisplayValue(condition?.value),
                                    'kirki-ecommerce',
                                  )
                                : sprintf(
                                    __('%s', 'kirki-ecommerce'),
                                    condition?.value as string | number,
                                  )}
                            </Text>
                          </RuleItemCondition>
                        ))}
                      </RuleItemConditions>
                      <RuleItemAction>
                        <Text variant="small" weight="medium">
                          {item?.action?.type === 'set_tax_rate'
                            ? `Then ${item?.action?.type}:`
                            : `Then ${item?.action?.type}`}
                        </Text>
                        {item?.action?.type === 'set_tax_rate' && (
                          <Text variant="small" weight="medium" cssOverride={styles.conditionValue}>
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
                    {editingRuleIndex === index && (
                      <TaxRulesDialog
                        states={states}
                        destinationLabel={destinationLabel}
                        conditionOptions={conditionOptions}
                        rules={rules}
                        updateTaxRules={updateTaxRules}
                        showModal={true}
                        setShowModal={() => setEditingRuleIndex(null)}
                        from="edit"
                        ruleIndex={index}
                      />
                    )}
                  </RuleItem>
                ))}
              </RuleItems>
            </Flex>
          )}
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
});
