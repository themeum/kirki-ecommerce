import { css } from '@emotion/react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { PaymentIcon, LocationIcon, TrashIcon } from '@/icons';
import { __, sprintf } from '@/wpi18n';
import { scoped } from '@/theme/mixins';

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

const taxCardCss = scoped({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: 'var(--decom-radius-rounded-md)',
  maxHeight: '44px',
  height: '44px',
  padding: 'var(--decom-spacing-3)',
});

const editGroupCss = css({
  display: 'none',
  pointerEvents: 'none',
  transition: 'opacity 0.2s',
});

const editGroupActiveCss = css({
  display: 'flex',
  pointerEvents: 'auto',
});

const rateDisplayCss = scoped({
  transition: 'opacity 0.2s',
  display: 'flex',
});

const rateDisplayHiddenCss = css({
  display: 'none',
});

const taxCardContentCss = scoped({
  display: 'flex',
  alignItems: 'center',
});

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
        <Card type="innerDark" style={{ padding: '36px 0' }}>
          <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
            <PaymentIcon />
            <span style={{ color: '#878593' }}>
              {__('Added tax rates will appear here', 'kirki-ecommerce')}
            </span>
          </Flex>
        </Card>
      ) : (
        <Card type="innerDark">
          <Text
            header={__('Tax rates', 'kirki-ecommerce')}
            style={{ marginBottom: 'var(--decom-spacing-2)' }}
          />
          <Flex gap={2} direction={'column'}>
            {taxRates?.map((item, index) => (
              <Card
                key={index}
                type="default"
                css={taxCardCss}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Text header={item?.state} leftIcon={<LocationIcon />} />
                <div css={taxCardContentCss}>
                  <Text
                    header={sprintf(__('%s %', 'kirki-ecommerce'), item?.rate)}
                    css={css(
                      rateDisplayCss,
                      hoveredIndex === index && rateDisplayHiddenCss,
                    )}
                  />

                  <Flex
                    gap={8}
                    css={css(
                      editGroupCss,
                      hoveredIndex === index && editGroupActiveCss,
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
              </Card>
            ))}
          </Flex>
        </Card>
      )}
    </div>
  );
};

TaxRateList.displayName = 'TaxRateList';
