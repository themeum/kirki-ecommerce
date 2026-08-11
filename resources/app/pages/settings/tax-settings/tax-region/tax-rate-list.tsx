import { css } from '@emotion/react';
import { type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import { LocationIcon, PaymentIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

import type { TaxRate } from '@/pages/settings/tax-settings/utils';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { Trash2 } from 'lucide-react';

type TaxRateListProps = {
  taxRates: TaxRate[];
  applySingleTax: boolean;
  setTaxRates: Dispatch<SetStateAction<TaxRate[]>>;
  handleSaveData: (
    updatedTaxRates?: TaxRate[],
    from?: string,
  ) => void | Promise<void>;
};

export const TaxRateList = ({
  taxRates,
  applySingleTax,
  setTaxRates,
  handleSaveData,
}: TaxRateListProps) => {
  const handleTaxRate = (item: TaxRate, value: number | string) => {
    setUnsavedDataStatus(true);
    setTaxRates((prev) =>
      prev.map((taxRate) =>
        taxRate.state === item.state ? { ...taxRate, rate: value } : taxRate,
      ),
    );
  };

  const handleDeleteRate = (item: TaxRate) => {
    const initialList = Array.isArray(taxRates) ? [...taxRates] : [];

    const updatedTaxRates = initialList.filter(
      (taxItem) => taxItem.state !== item.state,
    );
    setTaxRates(updatedTaxRates);
    toast(__('VAT rate deleted', 'kirki-ecommerce'), {
      duration: 5000,
      action: {
        label: __('Undo', 'kirki-ecommerce'),
        onClick: () => {
          setTaxRates(initialList);
        },
      },
      onAutoClose: () => {
        void handleSaveData(updatedTaxRates, 'delete');
      },
    });
  };

  return (
    <div>
      {!applySingleTax && !taxRates.length ? (
        <Card cssOverride={cardStyles.innerDarkCard}>
          <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyContent)}>
            <Flex direction="column" gap={2} align="center">
              <PaymentIcon />
              <span css={scoped(styles.mutedText)}>
                {__('Added tax rates will appear here', 'kirki-ecommerce')}
              </span>
            </Flex>
          </CardContent>
        </Card>
      ) : (
        <Card cssOverride={cardStyles.innerDarkCard}>
          <CardContent cssOverride={cardStyles.innerDarkContent}>
            <Text cssOverride={styles.taxRatesHeader}>{__('Tax rates', 'kirki-ecommerce')}</Text>
            <Flex gap={1} direction="column">
              {taxRates?.map((item, index) => (
                <Card key={index} cssOverride={{ width: '100%' }}>
                  <CardContent cssOverride={{ width: '100%' }}>
                    <Flex justify="space-between" align="center">
                      <Flex gap={2} align="center">
                        <LocationIcon />
                        <Text>{item?.state}</Text>
                      </Flex>
                      <Flex cssOverride={scoped(styles.taxCardContent)} align="center" gap={2}>
                        <Text variant="small" weight="medium">
                          {sprintf(__('%d%', 'kirki-ecommerce'), item?.rate)}
                        </Text>

                        <Flex gap={2} align="center">
                          <Input
                            value={item?.rate ?? ''}
                            style={{ width: '72px' }}
                            onChange={(e) => handleTaxRate(item, e.target.value)}
                            onBlur={(e) => handleTaxRate(item, e.target.value)}
                            type="number"
                            min={0}
                            max={100}
                          />
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleDeleteRate(item)}
                          >
                            <Trash2 />
                          </Button>
                        </Flex>
                      </Flex>
                    </Flex>
                  </CardContent>
                </Card>
              ))}
            </Flex>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

TaxRateList.displayName = 'TaxRateList';

const styles = defineStyles({
  emptyContent: { padding: `${theme.spacing[9]} 0` },
  mutedText: {
    color: theme.colors.text.subdued,
  },
  taxCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius.md,
    maxHeight: '44px',
    height: '44px',
    padding: theme.spacing[3],
  },
  editGroup: css({
    transition: 'opacity 0.2s',
  }),
  editGroupActive: css({
    display: 'flex',
    pointerEvents: 'auto',
  }),
  rateDisplay: {
    transition: 'opacity 0.2s',
    display: 'flex',
  },
  rateDisplayHidden: css({
    display: 'none',
  }),
  taxCardContent: {
    display: 'flex',
    alignItems: 'center',
  },
  taxRatesHeader: {
    marginBottom: theme.spacing[2],
  }
});
