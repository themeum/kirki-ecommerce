import type { ReactNode } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

import InputGroupField from '@/components/form/input-group-field';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { InputGroupText } from '@/components/ui/input-group';
import Text from '@/components/ui/text';
import { cardStyles } from '@/theme/card-styles';
import { mergeCss } from '@/theme/mixins';

type SingleTaxRateProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  label: string;
  name: TName;
  icon?: ReactNode;
};

const SingleTaxRate = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  icon,
}: SingleTaxRateProps<TFieldValues, TName>) => {
  return (
    <Card cssOverride={mergeCss(cardStyles.innerDarkCard)}>
      <CardContent cssOverride={{ width: '100%' }}>
        <Flex align="center" justify="space-between" cssOverride={{ height: '56px' }}>
          <Flex align="center" gap={2}>
            {icon}
            <Text variant="small" weight="medium">
              {label}
            </Text>
          </Flex>
          <InputGroupField
            name={name}
            type="number"
            min={0}
            max={100}
            placeholder="0"
            endContent={<InputGroupText>%</InputGroupText>}
            cssOverride={{ width: '120px' }}
          />
        </Flex>
      </CardContent>
    </Card>
  );
};

SingleTaxRate.displayName = 'SingleTaxRate';

export default SingleTaxRate;
