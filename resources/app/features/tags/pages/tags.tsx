import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import NewTagButton from '@/features/tags/components/new-tag-button';
import TagTable from '@/features/tags/components/tag-table/tag-table';
import { useTagsQuery } from '@/features/tags/services/tag';
import { tagListOptions } from '@/features/tags/types';
import { useDataTableParams } from '@/hooks';
import { TagEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Tags = () => {
  const { params } = useDataTableParams(tagListOptions);

  const { data, isFetching } = useTagsQuery(params);

  const hasRecord = data?.has_records !== false;

  return (
    <Page>
      <PageHeading text={__('Tags', 'kirki-ecommerce')} actions={hasRecord && <NewTagButton />} />
      <PageContent>
        {!hasRecord ? (
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
