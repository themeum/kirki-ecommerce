import { useEffect, useRef } from 'react';

import Flex from '@/components/ui/flex';
import Spinner from '@/components/ui/spinner';
import Text from '@/components/ui/text';
import { __ } from '@/wpi18n';

type InfiniteScrollSentinelProps = {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
};

const InfiniteScrollSentinel = ({
  hasMore,
  isLoading,
  onLoadMore,
}: InfiniteScrollSentinelProps) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isLoading) {
        onLoadMore();
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div ref={sentinelRef}>
      {isLoading && (
        <Flex align="center" justify="center" gap={2}>
          <Spinner />
          <Text variant="small" color="secondary">
            {__('Loading...', 'kirki-ecommerce')}
          </Text>
        </Flex>
      )}
    </div>
  );
};

InfiniteScrollSentinel.displayName = 'InfiniteScrollSentinel';

export default InfiniteScrollSentinel;
export type { InfiniteScrollSentinelProps };
