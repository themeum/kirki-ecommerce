import { LightningBoltIcon } from '@radix-ui/react-icons';
import { Edit3, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import { getDestinationDisplayValue } from '@/pages/settings/tax-settings/tax-region/tax-rules/helper';
import TaxRulesDialog from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules-dialog';
import type { TaxRegion, TaxRule } from '@/pages/settings/tax-settings/utils';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type TaxRulesProps = {
  region?: TaxRegion;
  updateTaxRules: (
    rulesList: TaxRule[],
    from?: string,
  ) => void | Promise<void>;
};

const TaxRules = (props: TaxRulesProps) => {
  const { region, updateTaxRules } = props;
  const [addRuleModal, setAddRuleModal] = useState(false);
  const [rulesObj, setRulesObj] = useState<TaxRule[]>([]);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  useEffect(() => {
    setRulesObj(Array.isArray(region?.rules) ? [...region.rules] : []);
  }, [region]);

  const handleDeleteRules = (_item: TaxRule, index: number) => {
    const initialRules = Array.isArray(rulesObj) ? [...rulesObj] : [];
    const updatedRules = initialRules.filter((_, i) => i !== index);
    setRulesObj(updatedRules);

    toast(__('Tax rule deleted', 'kirki-ecommerce'), {
      duration: 5000,
      action: {
        label: __('Undo', 'kirki-ecommerce'),
        onClick: () => {
          setRulesObj(initialRules);
        },
      },
      onAutoClose: () => {
        void updateTaxRules(updatedRules, 'delete');
      },
    });
  };

  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
          <HeaderActionsCard
            header={__('Tax Rules', 'kirki-ecommerce')}
            subHeader={__(
              'Define conditional rules to adjust tax prices based on product type, weight, zone, or cart value.',
              'kirki-ecommerce',
            )}
            buttonText={__('Add Rule', 'kirki-ecommerce')}
            onAdd={() => setAddRuleModal(true)}
          />
          {(addRuleModal || rulesObj.length > 0) && (
            <Flex direction="column" gap={4}>
              {addRuleModal && (
                <TaxRulesDialog
                  showModal={addRuleModal}
                  setShowModal={setAddRuleModal}
                  rulesObj={rulesObj}
                  setRulesObj={setRulesObj}
                  updateTaxRules={updateTaxRules}
                  from="add"
                  region={region}
                />
              )}
              <RuleItems cssOverride={styles.ruleItems}>
                {rulesObj?.map((item, index) => (
                  <RuleItem key={index} id={String(index)}>
                    <RuleItemContent>
                      <RuleItemBadge>
                        <LightningBoltIcon width={12} height={12} />
                        <Text variant="small">
                          {sprintf(__('Rule %s', 'kirki-ecommerce'), index + 1)}
                        </Text>
                      </RuleItemBadge>
                      <RuleItemConditions>
                        {item?.conditions.map((condition, conditionIndex) => (
                          <RuleItemCondition key={conditionIndex}>
                            <Text variant="small" weight="medium">
                              {conditionIndex === 0
                                ? sprintf(
                                  __('IF %1$s %2$s', 'kirki-ecommerce'),
                                  condition?.type,
                                  condition?.operator,
                                )
                                : sprintf(
                                  __('AND IF %1$s %2$s', 'kirki-ecommerce'),
                                  condition?.type,
                                  condition?.operator,
                                )}
                            </Text>
                            <Text variant="small" weight="medium" cssOverride={styles.conditionValue}>{condition?.type === 'destination_region'
                              ? __(
                                getDestinationDisplayValue(
                                  condition?.value,
                                ),
                                'kirki-ecommerce',
                              )
                              : sprintf(
                                __('%s', 'kirki-ecommerce'),
                                condition?.value as string | number,
                              )}</Text>
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
                          <Text variant="small" weight="medium" cssOverride={styles.conditionValue}>{item?.action?.value as string}</Text>
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
                        region={region}
                        rulesObj={rulesObj}
                        setRulesObj={setRulesObj}
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

export default TaxRules;

const styles = defineStyles({
  ruleItems: {
    marginTop: theme.spacing[5],
  },
  conditionValue: {
    color: theme.colors.text.special3,
  },
});
