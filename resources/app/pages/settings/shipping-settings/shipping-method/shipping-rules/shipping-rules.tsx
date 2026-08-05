import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { EditPenIcon, LighteningIcon, TrashIcon } from '@/icons';
import { dispatchToastMessage } from '@/pages/utils';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { SettingsSectionData } from '@/types';
import { __, sprintf } from '@/wpi18n';

import ShippingRuleFormCard from '@/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rule-form-card';
import { actionOptionsArray, conditionOptions, saveShippingZones, type ShippingRule, type ShippingZone } from '@/pages/settings/shipping-settings/utils';

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
  const [hoveredRuleIndex, setHoveredRuleIndex] = useState<number | null>(null);

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
      setRulesObj(foundMethod.shipping_rules || []);
    }
  }, [shippingSettingsData, methodId]);

  const handleDeleteRules = async (index: number) => {
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
          shippingSettingsData: shippingSettingsData as SettingsSectionData,
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
            <Flex direction={'column'} gap={4}>
              {showAddCard && (
                <ShippingRuleFormCard
                  methodId={methodId}
                  mode="add"
                  onCancel={() => setShowAddCard(false)}
                  onSaved={() => setShowAddCard(false)}
                />
              )}

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
                  <div key={index}>
                    <Card
                      cssOverride={mergeCss(styles.shippingRulesCard,
                        rulesObj.length > 1
                          ? styles.shippingRulesCardBorderRadius
                          : styles.shippingRulesCardSingle,)}
                      onMouseEnter={() => setHoveredRuleIndex(index)}
                      onMouseLeave={() => setHoveredRuleIndex(null)}
                    >
                      <CardContent>
                        <Flex justify="space-between">
                          <Flex direction={'column'} gap={4}>
                            <Card cssOverride={mergeCss(cardStyles.darkCard, styles.rulesNumberBadge)}>
                              <CardContent>
                                <Flex gap={2} align="center">
                                  <LighteningIcon />
                                  <Text variant="small">
                                    {sprintf(
                                      __('Rule %s', 'kirki-ecommerce'),
                                      index + 1,
                                    )}
                                  </Text>
                                </Flex>
                              </CardContent>
                            </Card>
                            <Flex direction={'column'} gap={2}>
                              <Flex gap={2}>
                                <Text>
                                  {sprintf(
                                    __('IF %1$s %2$s', 'kirki-ecommerce'),
                                    getConditionLabel(item?.conditions[0]?.type),
                                    getOperatorLabel(item?.conditions[0]?.operator),
                                  )}
                                </Text>
                                <Text cssOverride={styles.accentText}>
                                  {item?.conditions[0]?.type === 'destination_region'
                                    ? ((item?.conditions[0]?.value as { country?: string })?.country ?? '')
                                    : String(item?.conditions[0]?.value ?? '')}
                                </Text>
                              </Flex>
                              <Flex gap={2}>
                                <Text>
                                  {sprintf(
                                    __('Then %s:', 'kirki-ecommerce'),
                                    getActionLabel(item?.action?.type),
                                  )}
                                </Text>
                                {(item?.action?.type === 'set_shipping_cost' ||
                                  item?.action?.type === 'add_shipping_cost') && (
                                    <Text cssOverride={styles.accentText}>
                                      {String(item?.action?.value ?? '')}
                                    </Text>
                                  )}
                              </Flex>
                            </Flex>
                          </Flex>
                          <ActionGroup
                            cssOverride={mergeCss(styles.cardActions,
                              hoveredRuleIndex === index && styles.cardActionsActive,)}
                          >
                            <Button
                              variant="secondary"
                              onClick={() => handleDeleteRules(index)}
                            >
                              <TrashIcon />
                            </Button>

                            <Button
                              variant="secondary"
                              onClick={() => setEditingRuleIndex(index)}
                            >
                              <EditPenIcon />
                            </Button>
                          </ActionGroup>
                        </Flex>
                      </CardContent>
                    </Card>
                  </div>
                ),
              )}
            </Flex>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const styles = defineStyles({
  cardActions: css({
    display: 'none',
    pointerEvents: 'none',
    transition: 'opacity 0.15s ease',
  }),
  cardActionsActive: css({
    display: 'flex',
    pointerEvents: 'auto',
  }),
  shippingRulesCard: {
    padding: theme.spacing[3],
    minHeight: '118px',
    borderRadius: theme.radius.none,
    border: `1px solid ${theme.colors.border.default}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
  shippingRulesCardSingle: {
    borderRadius: theme.radius.lg,
  },
  shippingRulesCardBorderRadius: {
    '&:first-of-type': {
      borderRadius: `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.none} ${theme.radius.none}`,
    },
    '&:last-of-type': {
      borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
    },
  },
  rulesNumberBadge: {
    maxHeight: '26px',
    maxWidth: 'fit-content',
    borderRadius: theme.radius.sm,
    display: 'flex',
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
  },
  accentText: {
    color: theme.colors.text.special3,
  },
});
