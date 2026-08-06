import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { EditPenIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

import Badge from '@/components/ui/badge';
import { getDestinationDisplayValue } from '@/pages/settings/tax-settings/tax-region/tax-rules/helper';
import TaxRulesDialog from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules-dialog';
import type { TaxRegion, TaxRule } from '@/pages/settings/tax-settings/utils';
import { LightningBoltIcon } from '@radix-ui/react-icons';

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
        updateTaxRules(updatedRules, 'delete');
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
            <Flex direction={'column'} gap={4}>
              {addRuleModal && (
                <TaxRulesDialog
                  showModal={addRuleModal}
                  setShowModal={setAddRuleModal}
                  rulesObj={rulesObj}
                  setRulesObj={setRulesObj}
                  updateTaxRules={updateTaxRules}
                  from={'add'}
                  region={region}
                />
              )}
              <div css={scoped({ marginTop: theme.spacing[5] })}>
                {rulesObj?.map((item, index) => (
                  <Card key={index} cssOverride={mergeCss(cardStyles.formCard, styles.shippingRulesCard)}>
                    <CardContent>
                      <Flex justify="space-between">
                        <Flex direction="column" gap={4}>
                          <Badge>
                            <LightningBoltIcon width={12} height={12} />
                            {sprintf(__('Rule %s', 'kirki-ecommerce'), index + 1)}
                          </Badge>
                          <Flex direction={'column'} gap={2}>
                            <Flex direction={'column'} gap={2}>
                              {item?.conditions.map((condition, conditionIndex) => (
                                <Flex gap={2} key={conditionIndex}>
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
                              <Text variant="small" weight="medium">
                                {item?.action?.type === 'set_tax_rate'
                                  ? `Then ${item?.action?.type}:`
                                  : `Then ${item?.action?.type}`}
                              </Text>
                              {item?.action?.type === 'set_tax_rate' && (
                                <Text variant="small" weight="medium" cssOverride={styles.conditionValue}>{item?.action?.value as string}</Text>
                              )}
                            </Flex>
                          </Flex>
                        </Flex>
                        <ActionGroup cssOverride={styles.cardActions} data-card-action-group="true">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleDeleteRules(item, index)}
                          >
                            <TrashIcon />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setEditingRuleIndex(index)}
                          >
                            <EditPenIcon />
                          </Button>
                        </ActionGroup>
                      </Flex>
                      {editingRuleIndex === index && (
                        <TaxRulesDialog
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

const styles = defineStyles({
  cardActions: {
    visibility: 'hidden',
    transition: 'visibility 0.3s ease-in-out',
  },

  shippingRulesCard: {
    '&:hover': {
      '& [data-card-action-group]': {
        visibility: 'visible',
      }
    }
  },
  conditionValue: {
    color: theme.colors.text.special3,
  }
});
