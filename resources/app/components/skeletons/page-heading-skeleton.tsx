import type { ReactNode } from 'react';

import { type PageContainerSize, PageHeading } from '@/components/ui/page';
import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type PageHeadingSkeletonProps = {
  hasBack?: boolean;
  containerSize?: PageContainerSize;
  children?: ReactNode;
};

const BACK_BUTTON_SIZE = 32;
const TITLE_WIDTH = 120;
const TITLE_HEIGHT = 20;

const PageHeadingSkeleton = (props: PageHeadingSkeletonProps) => {
  const { hasBack = true, containerSize, children } = props;

  return (
    <PageHeading
      containerSize={containerSize}
      cssOverride={mergeCss(styles.heading, hasBack && styles.headingHasBack)}
      leftIcon={
        hasBack ? (
          <Skeleton width={BACK_BUTTON_SIZE} height={BACK_BUTTON_SIZE} radius="lg" />
        ) : null
      }
      text={<Skeleton width={TITLE_WIDTH} height={TITLE_HEIGHT} />}
      actions={children}
    />
  );
};

PageHeadingSkeleton.displayName = 'PageHeadingSkeleton';

export default PageHeadingSkeleton;

const styles = defineStyles({
  heading: {
    '[data-slot="skeleton"]': {
      backgroundColor: theme.colors.background.fillTertiary,
    },
  },
  headingHasBack: {
    paddingLeft: theme.spacing[0],
  },
});
