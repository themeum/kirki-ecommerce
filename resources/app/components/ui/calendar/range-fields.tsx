import { ArrowRight } from 'lucide-react';
import { useId } from 'react';

import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { formatDateValue } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type RangeFieldsProps = {
  from: Date | null;
  to: Date | null;
  displayFormat: string;
};

const RangeFields = ({ from, to, displayFormat }: RangeFieldsProps) => {
  const startId = useId();
  const endId = useId();

  return (
    <Flex align="flex-end" gap={2} data-slot="range-fields">
      <Flex direction="column" gap={1} cssOverride={styles.field}>
        <Label htmlFor={startId} cssOverride={styles.label}>
          {__('Start', 'kirki-ecommerce')}
        </Label>
        <Input id={startId} readOnly value={formatDateValue(from, displayFormat) ?? ''} />
      </Flex>
      <ArrowRight size={16} aria-hidden="true" css={scoped(styles.arrow)} />
      <Flex direction="column" gap={1} cssOverride={styles.field}>
        <Label htmlFor={endId} cssOverride={styles.label}>
          {__('End', 'kirki-ecommerce')}
        </Label>
        <Input id={endId} readOnly value={formatDateValue(to, displayFormat) ?? ''} />
      </Flex>
    </Flex>
  );
};

RangeFields.displayName = 'RangeFields';

export default RangeFields;
export type { RangeFieldsProps };

const styles = defineStyles({
  field: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...theme.typography.tiny(),
    color: theme.colors.text.secondary,
  },
  arrow: {
    flexShrink: 0,
    marginBottom: theme.spacing[2],
    color: theme.colors.icon.secondary,
  },
});
