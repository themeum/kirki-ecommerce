import { css, type CSSObject } from '@emotion/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { EditPenIcon, LighteningIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { mergeCss } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

import { getDestinationDisplayValue } from '@/pages/settings/tax-settings/tax-region/tax-rules/helper';
import TaxRulesModal from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules-dialog';
import type { TaxRegion, TaxRule } from '@/pages/settings/tax-settings/utils';

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
  const [hoveredRuleIndex, setHoveredRuleIndex] = useState<number | null>(null);

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
        updateTaxRules(updatedRules, 'delete');
      },
    });
  };

  return (
    <div>
      <Card cssOverride={cardStyles.largeCard}>
        <CardContent cssOverride={cardStyles.largeContentPadded}>
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
            <Flex direction={'column'} gap={4}>
              {addRuleModal && (
                <TaxRulesModal
                  showModal={addRuleModal}
                  setShowModal={setAddRuleModal}
                  rulesObj={rulesObj}
                  setRulesObj={setRulesObj}
                  updateTaxRules={updateTaxRules}
                  from={'add'}
                  region={region}
                />
              )}
              <div>
                {rulesObj?.map((item, index) => (
                  <Card
                    key={index}
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
                                <Text variant="small">{sprintf(__('Rule %s', 'kirki-ecommerce'), index + 1)}</Text>
                              </Flex>
                            </CardContent>
                          </Card>
                          <Flex direction={'column'} gap={2}>
                            <Flex direction={'column'} gap={2}>
                              {item?.conditions.map((condition, conditionIndex) => (
                                <Flex gap={2} key={conditionIndex}>
                                  <Text>{conditionIndex === 0
                                    ? sprintf(
                                      __('IF %1$s %2$s', 'kirki-ecommerce'),
                                      condition?.type,
                                      condition?.operator,
                                    )
                                    : sprintf(
                                      __('AND IF %1$s %2$s', 'kirki-ecommerce'),
                                      condition?.type,
                                      condition?.operator,
                                    )}</Text>
                                  <Text cssOverride={styles.conditionValue}>{condition?.type === 'destination_region'
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
                                </Flex>
                              ))}
                            </Flex>
                            <Flex gap={2}>
                              <Text>{item?.action?.type === 'set_tax_rate'
                                ? `Then ${item?.action?.type}:`
                                : `Then ${item?.action?.type}`}</Text>
                              {item?.action?.type === 'set_tax_rate' && (
                                <Text cssOverride={styles.conditionValue}>{`${item?.action?.value}`}</Text>
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
                            size="icon"
                            onClick={() => handleDeleteRules(item, index)}
                          >
                            <TrashIcon />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setEditingRuleIndex(index)}
                          >
                            <EditPenIcon />
                          </Button>
                        </ActionGroup>
                      </Flex>
                      {editingRuleIndex === index && (
                        <TaxRulesModal
                          region={region}
                          rulesObj={rulesObj}
                          setRulesObj={setRulesObj}
                          updateTaxRules={updateTaxRules}
                          showModal={true}
                          setShowModal={() => setEditingRuleIndex(null)}
                          from={'edit'}
                          ruleIndex={index}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Flex>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

TaxRules.displayName = 'TaxRules';

export default TaxRules;

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
  shippingRulesCard: ({
    padding: theme.spacing[3],
    minHeight: '118px',
    borderRadius: theme.radius.none,
    border: `1px solid ${theme.colors.border.default}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  } satisfies CSSObject),
  shippingRulesCardSingle: ({
    borderRadius: theme.radius.lg,
  } satisfies CSSObject),
  shippingRulesCardBorderRadius: ({
    '&:first-of-type': {
      borderRadius: `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.none} ${theme.radius.none}`,
    },
    '&:last-of-type': {
      borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
    },
  } satisfies CSSObject),
  rulesNumberBadge: ({
    maxHeight: '26px',
    maxWidth: 'fit-content',
    borderRadius: theme.radius.sm,
    display: 'flex',
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
  } satisfies CSSObject),
  conditionValue: ({
    color: theme.colors.text.special3,
  } satisfies CSSObject)
};
