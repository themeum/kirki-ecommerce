import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import Button from '@/components/ui/button';
import { InfoIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { flexCenter, scoped, defineStyles } from '@/theme/mixins';

const TableInfo = () => {
  return (
    <Flex>
      <Flex gap={8} align="center">
        <Flex gap={1}>
          <span>Sales</span>
          <span css={scoped(styles.mediumText)}>$11,200</span>
          <span css={scoped(styles.svgClass)}>
            <InfoIcon />
          </span>
        </Flex>
        <Flex gap={1}>
          <span>Orders</span>
          <span css={scoped(styles.mediumText)}>12</span>
          <span css={scoped(styles.svgClass)}>
            <InfoIcon />
          </span>
        </Flex>
        <Flex gap={1}>
          <span>Avg. order value</span>
          <span css={scoped(styles.mediumText)}>$5,600</span>
          <span css={scoped(styles.svgClass)}>
            <InfoIcon />
          </span>
        </Flex>
      </Flex>
      <ActionGroup>
        <Select disabled>
          <SelectTrigger cssOverride={styles.selectTrigger}>
            <SelectValue placeholder="This Week" />
          </SelectTrigger>
          <SelectContent />
        </Select>
        <Button variant="secondary">
          Go to Analytics
        </Button>
      </ActionGroup>
    </Flex>
  );
};

export default TableInfo;

const styles = defineStyles({
  svgClass: scoped(flexCenter()),
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
  mediumText: {
    ...theme.typography.paragraph('medium'),
  },
});
