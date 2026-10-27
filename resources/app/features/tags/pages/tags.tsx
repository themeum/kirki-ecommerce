import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import NewTagButton from '@/features/tags/components/new-tag-button';
import TagTable from '@/features/tags/components/tag-table/tag-table';
import { useTagsQuery } from '@/features/tags/services/tag';
import { tagListOptions } from '@/features/tags/types';
import { useDataTableParams } from '@/hooks';
import { TagEmptyStateIcon } from '@/icons/empty-state';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const Tags = () => {
  const { params } = useDataTableParams(tagListOptions);

  const { data, isFetching, isError, refetch, isFetched } = useTagsQuery(params);

  const showNoRecordState =
    isFetched && isDefined(data) && isDefined(data.has_records) && !data.has_records;

  return (
    <Page>
      <PageHeading
        text={__('Tags', 'kirki-ecommerce')}
        actions={!isFetching && !showNoRecordState && <NewTagButton />}
      />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : showNoRecordState ? (
          <NotFoundState
            icon={<TagEmptyStateIcon />}
            text={__('Label products with tags', 'kirki-ecommerce')}
            description={__(
              'Tags add flexible labels for search and filtering.',
              'kirki-ecommerce',
            )}
            actions={<NewTagButton label={__('Create Tag', 'kirki-ecommerce')} />}
          />
        ) : (
          <TagTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

Tags.displayName = 'Tags';

export default Tags;
