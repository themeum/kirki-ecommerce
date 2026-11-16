import { Edit3, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
import ShippingRuleFormCard from '@/features/settings/shipping/components/shipping-method/shipping-rules/shipping-rule-form-card';
import {
  getActionLabel,
  getActionValue,
  getConditionLabel,
  getOperatorLabel,
  resolveConditionValues,
} from '@/features/settings/shipping/lib/shipping-rules/helper';
import { mergeRuleIntoMethodRules } from '@/features/settings/shipping/lib/shipping-rules/rule-form';
import { useShippingProfilesQuery } from '@/features/settings/shipping/services/shipping';
import type { ShippingRule } from '@/features/settings/shipping/types';
import { useBaseCurrencySymbol } from '@/hooks';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type ShippingRulesProps = {
  zoneId: string | number;
  rules: ShippingRule[];
  onChange: (rules: ShippingRule[]) => void;
};

export const ShippingRules = ({ zoneId, rules, onChange }: ShippingRulesProps) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  const { data: categoryData } = useCategoriesQuery({ limit: -1 });
  const { data: shippingProfiles } = useShippingProfilesQuery({ limit: -1 });
  const baseCurrencySymbol = useBaseCurrencySymbol();
  const { data: countries } = useCountriesQuery({ limit: -1 });
  const { data: productSettings } = useSettingsQuery('product');
  const storeWeightUnit = (productSettings?.weight_unit as string | undefined) || 'kg';

  const handleRemoveRule = (index: number) => {
    onChange(rules.filter((_, idx) => idx !== index));
  };

  const handleAddRule = () => {
    setShowAddCard(true);
    setEditingRuleIndex(null);
  };

  const handleEditRule = (index: number) => {
    setEditingRuleIndex(index);
    setShowAddCard(false);
  };

  return (
    <Card
      data-search-skip="true"
      cssOverride={mergeCss(cardStyles.formCard, { border: 'none' })}
      noShadow
    >
      <CardContent cssOverride={{ paddingInline: theme.spacing[0] }}>
        <HeaderActionsCard
          header={__('Shipping Rules', 'kirki-ecommerce')}
          subHeader={__(
            'Define conditional rules to adjust shipping prices based on product type, weight, zone, or cart value.',
            'kirki-ecommerce',
          )}
          buttonText={__('Add', 'kirki-ecommerce')}
          onAdd={handleAddRule}
        />
        {(showAddCard || rules.length > 0) && (
          <Flex direction="column" gap={4} cssOverride={{ marginTop: theme.spacing[5] }}>
            {showAddCard && (
              <ShippingRuleFormCard
                zoneId={zoneId}
                mode="add"
                onSubmit={(rule) => onChange(mergeRuleIntoMethodRules(rules, rule, -1))}
                onCancel={() => setShowAddCard(false)}
                onSaved={() => setShowAddCard(false)}
                storeWeightUnit={storeWeightUnit}
              />
            )}

            <RuleItems>
              {rules.map((item, index) =>
                editingRuleIndex === index ? (
                  <ShippingRuleFormCard
                    key={index}
                    zoneId={zoneId}
                    mode="edit"
                    initialRule={item}
                    onSubmit={(rule) => onChange(mergeRuleIntoMethodRules(rules, rule, index))}
                    onCancel={() => setEditingRuleIndex(null)}
                    onSaved={() => setEditingRuleIndex(null)}
                    storeWeightUnit={storeWeightUnit}
                  />
                ) : (
                  <RuleItem key={index} id={String(index)}>
                    <RuleItemContent>
                      <RuleItemConditions>
                        <RuleItemCondition>
                          <Text variant="small" weight="medium">
                            {__('IF', 'kirki-ecommerce')}
                          </Text>
                          <Text variant="small" color="secondary">
                            {sprintf(
                              __('%1$s %2$s', 'kirki-ecommerce'),
                              getConditionLabel(item?.conditions[0]?.type),
                              getOperatorLabel(item?.conditions[0]?.operator),
                            )}
                          </Text>
                          <RuleItemValues
                            values={resolveConditionValues(
                              item?.conditions[0],
                              categoryData?.results ?? [],
                              shippingProfiles ?? [],
                              baseCurrencySymbol,
                              countries ?? [],
                              storeWeightUnit,
                            )}
                          />
                          <Text variant="small" weight="medium">
                            ,
                          </Text>
                        </RuleItemCondition>
                      </RuleItemConditions>
                      <RuleItemAction>
                        <Text variant="small" weight="medium">
                          {__('Then', 'kirki-ecommerce')}
                        </Text>
                        <Text variant="small" color="secondary">
                          {getActionLabel(item?.action?.type)}
                        </Text>
                        <Text variant="small" weight="medium" cssOverride={styles.accentText}>
                          {getActionValue(item?.action, baseCurrencySymbol)}
                        </Text>
                      </RuleItemAction>
                    </RuleItemContent>
                    <RuleItemActions>
                      <ActionGroup>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleRemoveRule(index)}
                        >
                          <Trash2 />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleEditRule(index)}
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
      </CardContent>
    </Card>
  );
};

const styles = defineStyles({
  accentText: {
    color: theme.colors.text.special3,
  },
});
