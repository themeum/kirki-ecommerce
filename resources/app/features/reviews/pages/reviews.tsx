import { MessageSquare } from 'lucide-react';

import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import ReviewTable from '@/features/reviews/components/review-table/review-table';
import { useReviewsQuery } from '@/features/reviews/services/review';
import { reviewListOptions, type ReviewListFilter } from '@/features/reviews/types';
import { useDataTableParams } from '@/hooks';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const Reviews = () => {
  const { params } = useDataTableParams<ReviewListFilter>(reviewListOptions);
  const { data, isFetching, isError, refetch, isFetched } = useReviewsQuery(params);

  const showNoRecordState =
    isFetched && isDefined(data) && isDefined(data.has_records) && !data.has_records;

  return (
    <Page>
      <PageHeading text={__('Reviews', 'kirki-ecommerce')} />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : showNoRecordState ? (
          <NotFoundState
            icon={<MessageSquare size={56} color="#94a3b8" />}
            text={__('No reviews yet', 'kirki-ecommerce')}
            description={__(
              'Customer reviews will appear here once submitted on your product pages.',
              'kirki-ecommerce',
            )}
          />
        ) : (
          <ReviewTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

Reviews.displayName = 'Reviews';

export default Reviews;
