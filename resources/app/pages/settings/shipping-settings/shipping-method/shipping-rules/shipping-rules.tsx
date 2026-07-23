import { css } from '@emotion/react';
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router';

import Flex from '@/components/ui/flex';
import ActionGroup from '@/components/ui/action-group';
import Text from '@/components/ui/text';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { __, sprintf } from '@/wpi18n';
import { LighteningIcon, EditPenIcon, TrashIcon } from '@/icons';
import HeaderActionsCard from '@/components/header-actions-card';
import { useSettingsQuery } from '@/services/settings';
import { dispatchToastMessage } from '@/pages/utils';
import type { SettingsSectionData } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

import { saveShippingZones, type ShippingRule, type ShippingZone } from '@/pages/settings/shipping-settings/utils';
import ShippingRuleModal from '@/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rule-dialog';

type ShippingRulesProps = {
  methodId: string | number;
};

export const ShippingRules = ({ methodId }: ShippingRulesProps) => {
  const [searchParams] = useSearchParams();
  const zoneId = searchParams.get('zoneId');

  const [addRuleModal, setAddRuleModal] = useState(false);
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
      <Card type="large">
        <HeaderActionsCard
          header={__('Shipping Rules', 'kirki-ecommerce')}
          subHeader={__(
            'Define conditional rules to adjust shipping prices based on product type, weight, zone, or cart value.',
            'kirki-ecommerce',
          )}
          buttonText={__('Add Rule', 'kirki-ecommerce')}
          onAdd={() => setAddRuleModal(true)}
        />
        {(addRuleModal || rulesObj.length > 0) && (
          <Flex direction={'column'} gap={16}>
            {addRuleModal && (
              <ShippingRuleModal
                methodId={methodId}
                rulesObj={rulesObj}
                setRulesObj={setRulesObj as Dispatch<SetStateAction<ShippingRule[] | ShippingRule>>}
                showModal={addRuleModal}
                setShowModal={setAddRuleModal}
                from="add"
              />
            )}

            {rulesObj?.map((item, index) => (
              <div key={index}>
                <Card
                  type="default"
                  css={css(
                    styles.shippingRulesCard,
                    rulesObj.length > 1
                      ? styles.shippingRulesCardBorderRadius
                      : styles.shippingRulesCardSingle,
                  )}
                  onMouseEnter={() => setHoveredRuleIndex(index)}
                  onMouseLeave={() => setHoveredRuleIndex(null)}
                >
                  <Flex style={{ justifyContent: 'space-between' }}>
                    <Flex direction={'column'} gap={16}>
                      <Card type="dark" css={styles.rulesNumberBadge}>
                        <Text
                          type="xsm"
                          header={sprintf(
                            __('Rule %s', 'kirki-ecommerce'),
                            index + 1,
                          )}
                          leftIcon={<LighteningIcon />}
                        />
                      </Card>
                      <Flex direction={'column'} gap={8}>
                        <Flex gap={8}>
                          <Text
                            header={sprintf(
                              __('IF %1$s %2$s', 'kirki-ecommerce'),
                              item?.conditions[0]?.type,
                              item?.conditions[0]?.operator,
                            )}
                          />
                          <Text
                            header={sprintf(
                              __('%s', 'kirki-ecommerce'),
                              item?.conditions[0]?.type === 'destination_region'
                                ? (
                                    item?.conditions[0]?.value as {
                                      country?: string;
                                    }
                                  )?.country ?? ''
                                : (item?.conditions[0]?.value as
                                    | string
                                    | number),
                            )}
                            style={{ color: '#9747FF' }}
                          />
                        </Flex>
                        <Flex gap={8}>
                          <Text
                            header={sprintf(__('Then %s:', 'kirki-ecommerce'))}
                          />
                          {(item?.action?.type === 'set_shipping_cost' ||
                            item?.action?.type === 'add_shipping_cost') && (
                            <Text
                              header={sprintf(
                                __('%d', 'kirki-ecommerce'),
                                item?.action?.value as string | number,
                              )}
                              style={{ color: '#9747FF' }}
                            />
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                    <ActionGroup
                      css={css(
                        styles.cardActions,
                        hoveredRuleIndex === index && styles.cardActionsActive,
                      )}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteRules(index)}
                      >
                        <TrashIcon />
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingRuleIndex(index)}
                      >
                        <EditPenIcon />
                      </Button>
                    </ActionGroup>
                  </Flex>
                  {editingRuleIndex === index && (
                    <ShippingRuleModal
                      methodId={methodId}
                      rulesObj={rulesObj[index]}
                      setRulesObj={setRulesObj as Dispatch<SetStateAction<ShippingRule[] | ShippingRule>>}
                      showModal={true}
                      setShowModal={() => setEditingRuleIndex(null)}
                      from={'edit'}
                      ruleIndex={index}
                    />
                  )}
                </Card>
              </div>
            ))}
          </Flex>
        )}
      </Card>
    </div>
  );
};

const styles = {
  cardActions: css({
    display: 'none',
    pointerEvents: 'none',
    transition: 'opacity 0.15s ease',
  }),
  cardActionsActive: css({
    display: 'flex',
    pointerEvents: 'auto',
  }),
  shippingRulesCard: scoped({
    padding: theme.spacing.lg,
    minHeight: '118px',
    borderRadius: theme.radius.none,
    border: `1px solid ${theme.colors.border.default}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing['2xl'],
  }),
  shippingRulesCardSingle: scoped({
    borderRadius: theme.radius.lg,
  }),
  shippingRulesCardBorderRadius: scoped({
    '&:first-of-type': {
      borderRadius: `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.none} ${theme.radius.none}`,
    },
    '&:last-of-type': {
      borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
    },
  }),
  rulesNumberBadge: scoped({
    maxHeight: '26px',
    maxWidth: 'fit-content',
    borderRadius: theme.radius.sm,
    display: 'flex',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
  }),
};
