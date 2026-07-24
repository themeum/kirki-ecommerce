import { css } from '@emotion/react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { PaymentIcon, LocationIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __, sprintf } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import type { TaxRate } from '@/pages/settings/tax-settings/utils';

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
        <Card css={cardStyles.innerDarkCard}>
          <CardContent css={[cardStyles.innerDarkContent, styles.emptyContent]}>
            <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
              <PaymentIcon />
              <span style={{ color: '#878593' }}>
                {__('Added tax rates will appear here', 'kirki-ecommerce')}
              </span>
            </Flex>
          </CardContent>
        </Card>
      ) : (
        <Card css={cardStyles.innerDarkCard}>
          <CardContent css={cardStyles.innerDarkContent}>
            <Text
              header={__('Tax rates', 'kirki-ecommerce')}
              css={styles.taxRatesHeader}
            />
            <Flex gap={2} direction={'column'}>
              {taxRates?.map((item, index) => (
                <Card
                  key={index}
                  css={styles.taxCard}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <CardContent>
                    <Text header={item?.state} leftIcon={<LocationIcon />} />
                    <div css={styles.taxCardContent}>
                      <Text
                        header={sprintf(__('%s %', 'kirki-ecommerce'), item?.rate)}
                        css={css(
                          styles.rateDisplay,
                          hoveredIndex === index && styles.rateDisplayHidden,
                        )}
                      />

                      <Flex
                        gap={8}
                        css={css(
                          styles.editGroup,
                          hoveredIndex === index && styles.editGroupActive,
                        )}
                      >
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
                          variant="secondary"
                          size="icon"
                          onClick={() => handleDeleteRate(item)}
                        >
                          <TrashIcon />
                        </Button>
                      </Flex>
                    </div>
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

const styles = {
  emptyContent: scoped({ padding: `${theme.spacing[9]} 0` }),
  taxCard: scoped({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius.md,
    maxHeight: '44px',
    height: '44px',
    padding: theme.spacing[3],
  }),
  editGroup: css({
    display: 'none',
    pointerEvents: 'none',
    transition: 'opacity 0.2s',
  }),
  editGroupActive: css({
    display: 'flex',
    pointerEvents: 'auto',
  }),
  rateDisplay: scoped({
    transition: 'opacity 0.2s',
    display: 'flex',
  }),
  rateDisplayHidden: css({
    display: 'none',
  }),
  taxCardContent: scoped({
    display: 'flex',
    alignItems: 'center',
  }),
  taxRatesHeader: scoped({
    marginBottom: theme.spacing[2],
  })
};
