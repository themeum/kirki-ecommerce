import type { ReactNode } from 'react';

import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scoped, scopedMerge } from '@/theme/mixins';

type PageHeadingSkeletonProps = {
  hasBack?: boolean;
  children?: ReactNode;
};

const BACK_BUTTON_SIZE = 32;
const TITLE_WIDTH = 120;
const TITLE_HEIGHT = 20;

const PageHeadingSkeleton = (props: PageHeadingSkeletonProps) => {
  const { hasBack = true, children } = props;

  return (
    <div css={scoped(styles.wrapper)}>
      <Container style={{ width: '100%' }}>
        <div css={scopedMerge(styles.heading, hasBack && styles.headingHasBack)}>
          {hasBack && (
            <Skeleton width={BACK_BUTTON_SIZE} height={BACK_BUTTON_SIZE} radius="lg" />
          )}
          <div css={scoped(styles.title)}>
            <Skeleton width={TITLE_WIDTH} height={TITLE_HEIGHT} />
          </div>
          <Flex cssOverride={styles.actions} gap={2}>
            {children}
          </Flex>
        </div>
      </Container>
    </div>
  );
};

PageHeadingSkeleton.displayName = 'PageHeadingSkeleton';

export default PageHeadingSkeleton;

const styles = defineStyles({
  wrapper: {
    top: '32px',
    left: 0,
    marginBottom: theme.spacing[8],
    padding: `${theme.spacing[4]} ${theme.spacing[0]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    borderBottom: `1px solid ${theme.colors.border.default}`,
    backgroundColor: theme.colors.background.surfaceTertiary,
    zIndex: theme.zIndex.sticky,
    '[data-slot="skeleton"]': {
      backgroundColor: theme.colors.background.fillTertiary,
    },
  },
  heading: {
    width: '100%',
    ...itemCenter(),
    columnGap: theme.spacing[3],
    paddingLeft: theme.spacing[2],
  },
  headingHasBack: {
    paddingLeft: theme.spacing[0],
  },
  title: {
    ...itemCenter(),
    minHeight: theme.typography.heading5().lineHeight,
  },
  actions: {
    marginLeft: 'auto',
  },
});
