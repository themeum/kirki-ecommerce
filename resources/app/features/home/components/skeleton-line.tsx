import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import { defineStyles } from '@/theme/mixins';

type SkeletonLineProps = {
  width: string;
  lineHeight: string;
  barHeight?: string;
};

const SkeletonLine = (props: SkeletonLineProps) => {
  const { width, lineHeight, barHeight = '14px' } = props;

  return (
    <Flex align="center" cssOverride={{ ...styles.line, height: lineHeight }}>
      <Skeleton width={width} height={barHeight} />
    </Flex>
  );
};

SkeletonLine.displayName = 'SkeletonLine';

export default SkeletonLine;

const styles = defineStyles({
  line: {
    width: '100%',
    minWidth: 0,
  },
});
