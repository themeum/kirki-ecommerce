import { Info } from 'lucide-react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type CustomizeGroupHeadingProps = {
  title: string;
  info: string;
  count?: string;
};

const CustomizeGroupHeading = (props: CustomizeGroupHeadingProps) => {
  const { title, info, count } = props;

  return (
    <Flex align="center" gap={1}>
      <Text variant="tiny" color="primary" weight="semibold">
        {title}
      </Text>
      <Tooltip tip={info} position="top">
        <Info size={12} color={theme.colors.icon.secondary} aria-label={info} role="img" />
      </Tooltip>
      {count && (
        <Text variant="tiny" color="primary" cssOverride={styles.count}>
          {count}
        </Text>
      )}
    </Flex>
  );
};

CustomizeGroupHeading.displayName = 'CustomizeGroupHeading';

export default CustomizeGroupHeading;

const styles = defineStyles({
  count: {
    marginLeft: 'auto',
  },
});
