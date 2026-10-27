import type { ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type SettingsSwitchRowProps = {
  title: ReactNode;
  description?: ReactNode;
  control: ReactNode;
};

const SettingsSwitchRow = (props: SettingsSwitchRowProps) => {
  const { title, description, control } = props;

  return (
    <Flex justify="space-between" align="flex-start" gap={4}>
      <Flex direction="column" cssOverride={styles.text}>
        <Text weight="semibold">{title}</Text>
        {description && (
          <Text variant="small" color="secondary">
            {description}
          </Text>
        )}
      </Flex>
      <Flex align="center" cssOverride={styles.control}>
        {control}
      </Flex>
    </Flex>
  );
};

SettingsSwitchRow.displayName = 'SettingsSwitchRow';

export default SettingsSwitchRow;

const styles = defineStyles({
  text: {
    minWidth: 0,
    flex: 1,
  },
  control: {
    flexShrink: 0,
    minHeight: theme.typography.paragraph().lineHeight,
  },
});
