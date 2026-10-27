import { Edit3, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

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
import {
  getActionLabel,
  getActionValue,
  getConditionLabel,
  getOperatorLabel,
  resolveConditionValues,
} from '@/features/settings/shipping/lib/shipping-rules/helper';
import { saveShippingZones } from '@/features/settings/shipping/lib/utils';
import ShippingRuleFormCard from '@/features/settings/shipping/pages/shipping-method/shipping-rules/shipping-rule-form-card';
import { useShippingProfilesQuery } from '@/features/settings/shipping/services/shipping';
import type { ShippingRule, ShippingZone } from '@/features/settings/shipping/types';
import { useBaseCurrencySymbol, useConfirmDelete } from '@/hooks';
import { useCountriesQuery } from '@/services/country';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type ShippingRulesProps = {
  methodId: string | number;
};

export const ShippingRules = ({ methodId }: ShippingRulesProps) => {
  const { zone_id: zoneId } = useParams();

  const [showAddCard, setShowAddCard] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  const [rulesObj, setRulesObj] = useState<ShippingRule[]>([]);
  const { data: shippingSettingsData } = useSettingsQuery('shipping');
  const { data: categoryData } = useCategoriesQuery({ limit: -1 });
  const { data: shippingProfiles } = useShippingProfilesQuery({ limit: -1 });
  const { confirmDelete, deleteConfirmation } = useConfirmDelete();
  const baseCurrencySymbol = useBaseCurrencySymbol();
  const { data: countries } = useCountriesQuery({ limit: -1 });

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
    confirmDelete(
      {
        title: __('Delete shipping rule?', 'kirki-ecommerce'),
        description: __(
          'This rule will no longer adjust shipping prices for this method. This cannot be undone.',
          'kirki-ecommerce',
        ),
      },
      () => {
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

        void saveShippingZones({
          zones: updatedShippingZones,
          shippingSettingsData,
          toastMessage: __('Shipping rule deleted', 'kirki-ecommerce'),
        });
      },
    );
  };

  return (
    <div>
      <Card data-search-skip="true" cssOverride={cardStyles.formCard}>
        <CardContent>
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
      {deleteConfirmation}
    </div>
  );
};

const styles = defineStyles({
  accentText: {
    color: theme.colors.text.special3,
  },
});
