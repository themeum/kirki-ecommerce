import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import { cardStyles } from '@/theme/card-styles';

type SettingsFieldSkeletonProps = {
  controlHeight?: number;
};

const SettingsFieldSkeleton = ({ controlHeight = 36 }: SettingsFieldSkeletonProps) => (
  <Flex direction="column" gap={2}>
    <Skeleton width={112} height={12} />
    <Skeleton height={controlHeight} />
  </Flex>
);

SettingsFieldSkeleton.displayName = 'SettingsFieldSkeleton';

type SettingsCardSkeletonProps = {
  fields: number;
};

const SettingsCardSkeleton = ({ fields }: SettingsCardSkeletonProps) => (
  <Card cssOverride={cardStyles.formCard}>
    <CardContent>
      <Flex direction="column" gap={4}>
        {Array.from({ length: fields }, (_, index) => (
          <SettingsFieldSkeleton key={index} />
        ))}
      </Flex>
    </CardContent>
  </Card>
);

SettingsCardSkeleton.displayName = 'SettingsCardSkeleton';

type SettingsPageSkeletonProps = {
  cards: number[];
  header?: ReactNode;
};

const SettingsPageSkeleton = (props: SettingsPageSkeletonProps) => {
  const { cards, header } = props;

  return (
    <Flex direction="column" gap={4}>
      {header}
      {cards.map((fields, index) => (
        <SettingsCardSkeleton key={index} fields={fields} />
      ))}
    </Flex>
  );
};

SettingsPageSkeleton.displayName = 'SettingsPageSkeleton';

export default SettingsPageSkeleton;
export { SettingsCardSkeleton, SettingsFieldSkeleton };
