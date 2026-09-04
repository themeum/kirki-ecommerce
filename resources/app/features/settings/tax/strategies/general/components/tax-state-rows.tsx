import { ChevronRight } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import type { StateTaxRate } from '@/features/settings/tax/shared/lib/utils';
import type { TaxRegionGeneralFormInput } from '@/features/settings/tax/strategies/general/schemas/forms/tax-region-general-form';
import { PaymentIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type TaxStateRowsProps = {
  code: string;
  stateNameById: Record<string, string>;
};

const TaxStateRows = ({ code, stateNameById }: TaxStateRowsProps) => {
  const navigate = useNavigate();
  const { control, formState } = useFormContext<TaxRegionGeneralFormInput>();
  const { fields, remove } = useFieldArray({ control, name: 'states' });
  const states = (useWatch({ control, name: 'states' }) ?? []) as StateTaxRate[];

  const arrayError = formState.errors.states as { message?: string } | undefined;

  if (!fields.length) {
    return (
      <>
        <Card cssOverride={cardStyles.innerDarkCard}>
          <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyContent)}>
            <Flex direction="column" gap={2} align="center">
              <PaymentIcon />
              <span css={scoped(styles.mutedText)}>
                {__('Add a state to set its product and shipping tax rate', 'kirki-ecommerce')}
              </span>
            </Flex>
          </CardContent>
        </Card>
        {arrayError?.message && <FieldError>{arrayError.message}</FieldError>}
      </>
    );
  }

  return (
    <Flex direction="column" gap={3}>
      {fields.map((field, index) => {
        const row = states[index];
        const id = String(row?.id ?? '');
        const stateLabel = stateNameById[id] ?? row?.name ?? id;

        return (
          <Card key={field.id} cssOverride={mergeCss(cardStyles.innerCard, styles.stateRow)}>
            <CardContent cssOverride={cardStyles.innerContent}>
              <Flex
                align="center"
                justify="space-between"
                gap={2}
                cssOverride={{ width: '100%', height: '32px' }}
              >
                <Text
                  variant="small"
                  weight="medium"
                  cssOverride={{ cursor: 'pointer' }}
                  onClick={() =>
                    void navigate(
                      RouteConfig.Settings.get('TaxSettings')
                        .get('EditTaxRegionState')
                        .buildLink({ code, state: id }),
                    )
                  }
                >
                  {stateLabel}
                </Text>
                <Flex align="center" gap={2}>
                  <Text variant="tiny" color="secondary" data-state-row="rate">
                    {sprintf(
                      /* translators: 1: product tax rate, 2: shipping tax rate */
                      __('%1$s%% Product Tax • %2$s%% Shipping Tax', 'kirki-ecommerce'),
                      String(row?.product_tax_rate ?? 0),
                      String(row?.shipping_tax_rate ?? 0),
                    )}
                  </Text>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    data-state-row="remove"
                    aria-label={__('Remove state', 'kirki-ecommerce')}
                    onClick={(event) => {
                      event.stopPropagation();
                      remove(index);
                    }}
                  >
                    <TrashIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      void navigate(
                        RouteConfig.Settings.get('TaxSettings')
                          .get('EditTaxRegionState')
                          .buildLink({ code, state: id }),
                      )
                    }
                  >
                    <ChevronRight size={16} css={scoped(styles.chevron)} />
                  </Button>
                </Flex>
              </Flex>
            </CardContent>
          </Card>
        );
      })}
    </Flex>
  );
};

TaxStateRows.displayName = 'TaxStateRows';

export default TaxStateRows;

const styles = defineStyles({
  emptyContent: { padding: `${theme.spacing[9]} 0` },
  mutedText: {
    color: theme.colors.text.subdued,
  },
  stateRow: {
    '& [data-state-row="remove"]': {
      display: 'none',
    },
    '&:hover [data-state-row="rate"]': {
      display: 'none',
    },
    '&:hover [data-state-row="remove"]': {
      display: 'flex',
    },
  },
  chevron: {
    color: theme.colors.text.subdued,
  },
});
