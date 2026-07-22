import { Card } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import Flex from '@/components/ui/flex';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';

type SingleTaxRateProps = {
  centralTaxValue: number | string;
  setCentralTaxValue: (value: number | string) => void;
};

export const SingleTaxRate = ({
  centralTaxValue,
  setCentralTaxValue,
}: SingleTaxRateProps) => {
  const handleTaxRate = (value: number | string) => {
    setCentralTaxValue(value);
    setUnsavedDataStatus(true);
  };
  return (
    <div>
      <Card
        className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner-dark ${CLASS_PREFIX}-tax-card`}
      >
        <Text type="secondary" header={__('Tax rates', 'kirki-ecommerce')} />
        <div className={`${CLASS_PREFIX}-tax-card-content`}>
          <Text
            header={centralTaxValue}
            className={`${CLASS_PREFIX}-rate-display`}
          />

          <Flex gap={8} className={`${CLASS_PREFIX}-edit-group`}>
            <Input
              value={centralTaxValue}
              style={{ width: '72px' }}
              onChange={(e) => handleTaxRate(e.target.value)}
              onBlur={(e) => handleTaxRate(e.target.value)}
              type="number"
              min={0}
              max={100}
            />
          </Flex>
        </div>
      </Card>
    </div>
  );
};
