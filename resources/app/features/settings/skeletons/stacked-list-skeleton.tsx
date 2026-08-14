import type { CSSObject } from '@emotion/react';

import ActionGroup from '@/components/ui/action-group';
import Skeleton from '@/components/ui/skeleton';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';

type StackedListSkeletonProps = {
  rowCount?: number;
  hasMedia?: boolean;
  actionCount?: number;
  cssOverride?: CSSObject;
};

const DEFAULT_ROW_COUNT = 3;
const MEDIA_SIZE = 32;
const ACTION_SIZE = 28;

const StackedListSkeleton = (props: StackedListSkeletonProps) => {
  const { rowCount = DEFAULT_ROW_COUNT, hasMedia = true, actionCount = 2, cssOverride } = props;

  return (
    <StackedItems aria-busy cssOverride={cssOverride}>
      {Array.from({ length: rowCount }, (_, index) => (
        <StackedItem key={index} id={String(index)}>
          {hasMedia && (
            <StackedItemMedia>
              <Skeleton width={MEDIA_SIZE} height={MEDIA_SIZE} radius="sm" />
            </StackedItemMedia>
          )}
          <StackedItemContent>
            <StackedItemTitle>
              <Skeleton width={160} height={12} />
            </StackedItemTitle>
          </StackedItemContent>
          <StackedItemActions>
            <ActionGroup>
              {Array.from({ length: actionCount }, (_, actionIndex) => (
                <Skeleton
                  key={actionIndex}
                  width={ACTION_SIZE}
                  height={ACTION_SIZE}
                  radius="sm"
                />
              ))}
            </ActionGroup>
          </StackedItemActions>
        </StackedItem>
      ))}
    </StackedItems>
  );
};

StackedListSkeleton.displayName = 'StackedListSkeleton';

export default StackedListSkeleton;
