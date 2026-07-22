import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import HeaderActionsCard from '@/components/header-actions-card';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditPenIcon, LighteningIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { CLASS_PREFIX } from '@/conf';
import { __, sprintf } from '@/wpi18n';

import type { TaxRegion, TaxRule } from '@/pages/settings/tax-settings/utils';
import { getDestinationDisplayValue } from '@/pages/settings/tax-settings/tax-region/tax-rules/helper';
import TaxRulesModal from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules-dialog';

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
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
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
          <Flex direction={'column'} gap={16}>
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
                  className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-default ${CLASS_PREFIX}-shipping-rules-card`}
                  key={index}
                >
                  <Flex style={{ justifyContent: 'space-between' }}>
                    <Flex direction={'column'} gap={16}>
                      <Card
                        className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-dark ${CLASS_PREFIX}-rules-number-badge`}
                      >
                        <Text
                          type="xsm"
                          header={sprintf(__('Rule %s', 'kirki-ecommerce'), index + 1)}
                          leftIcon={<LighteningIcon />}
                        />
                      </Card>
                      <Flex direction={'column'} gap={8}>
                        <Flex direction={'column'} gap={8}>
                          {item?.conditions.map((condition, conditionIndex) => (
                            <Flex gap={8} key={conditionIndex}>
                              <Text
                                header={
                                  conditionIndex === 0
                                    ? sprintf(
                                        __('IF %1$s %2$s', 'kirki-ecommerce'),
                                        condition?.type,
                                        condition?.operator,
                                      )
                                    : sprintf(
                                        __('AND IF %1$s %2$s', 'kirki-ecommerce'),
                                        condition?.type,
                                        condition?.operator,
                                      )
                                }
                              />
                              <Text
                                header={
                                  condition?.type === 'destination_region'
                                    ? __(
                                        getDestinationDisplayValue(
                                          condition?.value,
                                        ),
                                        'kirki-ecommerce',
                                      )
                                    : sprintf(
                                        __('%s', 'kirki-ecommerce'),
                                        condition?.value as string | number,
                                      )
                                }
                                style={{
                                  color: 'var(--decom-text-text-special-3)',
                                }}
                              />
                            </Flex>
                          ))}
                        </Flex>
                        <Flex gap={8}>
                          <Text
                            header={
                              item?.action?.type === 'set_tax_rate'
                                ? `Then ${item?.action?.type}:`
                                : `Then ${item?.action?.type}`
                            }
                          />
                          {item?.action?.type === 'set_tax_rate' && (
                            <Text
                              header={`${item?.action?.value}`}
                              style={{
                                color: 'var(--decom-text-text-special-3)',
                              }}
                            />
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                    <ActionGroup className={`${CLASS_PREFIX}-card-actions`}>
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
                </Card>
              ))}
            </div>
          </Flex>
        )}
      </Card>
    </div>
  );
};

TaxRules.displayName = 'TaxRules';

export default TaxRules;
