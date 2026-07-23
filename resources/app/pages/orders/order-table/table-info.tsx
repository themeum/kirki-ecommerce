import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Button from '@/components/ui/button';
import { InfoIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import { flexCenter, scoped } from '@/theme/mixins';

const TableInfo = () => {
  return (
    <Flex>
      <Flex gap={32} style={{ alignItems: 'center' }}>
        <Flex gap={4}>
          <span>Sales</span>
          <span style={{ fontWeight: '500' }}>$11,200</span>
          <span css={styles.svgClass}>
            <InfoIcon />
          </span>
        </Flex>
        <Flex gap={4}>
          <span>Orders</span>
          <span style={{ fontWeight: '500' }}>12</span>
          <span css={styles.svgClass}>
            <InfoIcon />
          </span>
        </Flex>
        <Flex gap={4}>
          <span>Avg. order value</span>
          <span style={{ fontWeight: '500' }}>$5,600</span>
          <span css={styles.svgClass}>
            <InfoIcon />
          </span>
        </Flex>
      </Flex>
      <ActionGroup>
        <Select disabled>
          <SelectTrigger style={{ padding: '8px 16px' }}>
            <SelectValue placeholder="This Week" />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button variant="secondary" size="sm">
          Go to Analytics
        </Button>
      </ActionGroup>
    </Flex>
  );
};

export default TableInfo;

const styles = {
  svgClass: scoped(flexCenter()),
};
