import { Edit3, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

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
import { LighteningIcon } from '@/icons';
import ShippingRuleFormCard from '@/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rule-form-card';
import { actionOptionsArray, conditionOptions, saveShippingZones, type ShippingRule, type ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { dispatchToastMessage } from '@/pages/utils';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { toDisplayString } from '@/utils/string';
import { __, sprintf } from '@/wpi18n';

type ShippingRulesProps = {
  methodId: string | number;
};

const getConditionLabel = (type?: string): string =>
  conditionOptions.find((option) => option.value === type)?.title ?? type ?? '';

const getOperatorLabel = (operator?: string): string => {
  if (operator === '>') {
    return __('> (Greater than)', 'kirki-ecommerce');
  }
  if (operator === '<') {
    return __('< (Less than)', 'kirki-ecommerce');
  }
  if (operator === '=') {
    return __('= (Equal to)', 'kirki-ecommerce');
  }
  return __('is', 'kirki-ecommerce');
};

const getActionLabel = (type?: string): string =>
  actionOptionsArray.find((option) => option.value === type)?.title ?? type ?? '';

export const ShippingRules = ({ methodId }: ShippingRulesProps) => {
  const [searchParams] = useSearchParams();
  const zoneId = searchParams.get('zoneId');

  const [showAddCard, setShowAddCard] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  const [rulesObj, setRulesObj] = useState<ShippingRule[]>([]);
  const { data: shippingSettingsData } = useSettingsQuery('shipping');

  useEffect(() => {
    if (!shippingSettingsData?.shipping_zones || !methodId) {
      return;
    }
    const zones = shippingSettingsData.shipping_zones as ShippingZone[];
    if (!zones?.length) {
      return;
    }
    let foundMethod = null;

    for (const zone of zones) {
      const method = zone.shipping_methods?.find((m) => m.id === methodId);

      if (method) {
        foundMethod = method;
        break;
      }
    }
    if (foundMethod) {
      setRulesObj(foundMethod.shipping_rules ?? []);
    }
  }, [shippingSettingsData, methodId]);

  const handleDeleteRules = (index: number) => {
    const originalZones = [...rulesObj];
    const updatedRules = rulesObj.filter((_, idx) => idx !== index);
    setRulesObj(updatedRules);

    const zones = shippingSettingsData?.shipping_zones as ShippingZone[];
    const updatedShippingZones = zones?.map((zone) => {
      if (String(zone.id) !== String(zoneId)) {
        return zone;
      }

      return {
        ...zone,
        shipping_methods: zone?.shipping_methods.map((method) => {
          if (method.id !== methodId) {
            return method;
          }

          return {
            ...method,
            shipping_rules: updatedRules,
          };
        }),
      };
    });

    dispatchToastMessage('delete', {
      title: __('Shipping rule deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setRulesObj(originalZones);
      },
      onSuccess: async () => {
        await saveShippingZones({
          zones: updatedShippingZones,
          from: 'delete',
          shippingSettingsData,
        });
      },
    });
  };

  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
          <HeaderActionsCard
            header={__('Shipping Rules', 'kirki-ecommerce')}
            subHeader={__(
              'Define conditional rules to adjust shipping prices based on product type, weight, zone, or cart value.',
              'kirki-ecommerce',
            )}
            buttonText={__('Add Rule', 'kirki-ecommerce')}
            onAdd={() => setShowAddCard(true)}
          />
          {(showAddCard || rulesObj.length > 0) && (
            <Flex direction="column" gap={4} cssOverride={{ marginTop: theme.spacing[5] }}>
              {showAddCard && (
                <ShippingRuleFormCard
                  methodId={methodId}
                  mode="add"
                  onCancel={() => setShowAddCard(false)}
                  onSaved={() => setShowAddCard(false)}
                />
              )}

              <RuleItems>
                {rulesObj?.map((item, index) =>
                  editingRuleIndex === index ? (
                    <ShippingRuleFormCard
                      key={index}
                      methodId={methodId}
                      mode="edit"
                      initialRule={item}
                      ruleIndex={index}
                      onCancel={() => setEditingRuleIndex(null)}
                      onSaved={() => setEditingRuleIndex(null)}
                    />
                  ) : (
                    <RuleItem key={index} id={String(index)}>
                      <RuleItemContent>
                        <RuleItemBadge>
                          <LighteningIcon />
                          <Text variant="small">
                            {sprintf(
                              __('Rule %s', 'kirki-ecommerce'),
                              index + 1,
                            )}
                          </Text>
                        </RuleItemBadge>
                        <RuleItemConditions>
                          <RuleItemCondition>
                            <Text variant="small" weight="medium">
                              {sprintf(
                                __('IF %1$s %2$s', 'kirki-ecommerce'),
                                getConditionLabel(item?.conditions[0]?.type),
                                getOperatorLabel(item?.conditions[0]?.operator),
                              )}
                            </Text>
                            <Text variant="small" weight="medium" cssOverride={styles.accentText}>
                              {item?.conditions[0]?.type === 'destination_region'
                                ? ((item?.conditions[0]?.value as { country?: string })?.country ?? '')
                                : toDisplayString(item?.conditions[0]?.value)}
                            </Text>
                          </RuleItemCondition>
                        </RuleItemConditions>
                        <RuleItemAction>
                          <Text variant="small" weight="medium">
                            {sprintf(
                              __('Then %s:', 'kirki-ecommerce'),
                              getActionLabel(item?.action?.type),
                            )}
                          </Text>
                          {(item?.action?.type === 'set_shipping_cost' ||
                            item?.action?.type === 'add_shipping_cost') && (
                              <Text variant="small" weight="medium" cssOverride={styles.accentText}>
                                {toDisplayString(item?.action?.value)}
                              </Text>
                            )}
                        </RuleItemAction>
                      </RuleItemContent>
                      <RuleItemActions>
                        <ActionGroup>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleDeleteRules(index)}
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
        </CardContent>
      </Card>
    </div>
  );
};

const styles = defineStyles({
  accentText: {
    color: theme.colors.text.special3,
  },
});
